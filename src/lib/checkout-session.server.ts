import { z } from "zod";
import { isApprovalStillValid } from "@/lib/approval-state";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";
import { getStripeClientConfig } from "@/lib/stripe-config.server";

export const createCheckoutSessionInputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(12),
        addSupplies: z.boolean().optional(),
        addTelevisit: z.boolean().optional(),
        addBacWater: z.boolean().optional(),
        acknowledged: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(20),
  returnUrl: z.string().url(),
  environment: z.enum(["sandbox", "live"]).optional().default("live"),
  televisitAppointmentId: z.string().uuid().optional().nullable(),
  couponCode: z.string().min(1).max(40).optional().nullable(),
});

export const payApprovedOrderInputSchema = z.object({
  orderId: z.string().uuid(),
  returnUrl: z.string().url(),
  environment: z.enum(["sandbox", "live"]).optional().default("live"),
});

export const orderStatusInputSchema = z.object({ orderId: z.string().uuid() });

type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionInputSchema>;
type PayApprovedOrderInput = z.infer<typeof payApprovedOrderInputSchema>;

type AuthContext = {
  supabase: any;
  userId: string;
  claims: { email?: string } | null;
};

const priceIdOverrides: Record<string, string> = {
  "lab-female-fertility": "lab_female_fertility_v2",
  "lab-nutritional-health": "lab_nutritional_health_v2",
  "lab-womens-hormone-nutritional": "lab_womens_hormone_nutritional_v2",
  "lab-male-trt-monitoring": "lab_male_trt_monitoring_v2",
  "lab-male-basic-health": "lab_male_basic_health_v2",
  "lab-womens-hrt-monitoring": "lab_womens_hrt_monitoring_v2",
};

function slugToPriceId(slug: string) {
  return priceIdOverrides[slug] ?? slug.replace(/-/g, "_");
}

async function ensureStripePrice(
  stripe: ReturnType<typeof createStripeClient>,
  product: { slug: string; name: string; description: string | null; price_cents: number },
) {
  const lookupKey = slugToPriceId(product.slug);
  // Include inactive prices: a stale price can still hold the lookup key and
  // block creation ("already uses that lookup key").
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 10 });
  const reusable = existing.data.find(
    (p) => p.active && p.currency === "usd" && p.unit_amount === product.price_cents,
  );
  if (reusable) return reusable;

  const matchingProducts = await stripe.products.search({
    query: `metadata['slug']:'${product.slug}'`,
    limit: 1,
  });
  const stripeProduct = matchingProducts.data[0] ?? await stripe.products.create({
    name: product.name,
    ...(product.description ? { description: product.description.slice(0, 500) } : {}),
    metadata: { slug: product.slug },
  });

  return stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: product.price_cents,
    currency: "usd",
    lookup_key: lookupKey,
    // Reclaim the key from a stale/mismatched price instead of erroring.
    ...(existing.data.length > 0 ? { transfer_lookup_key: true } : {}),
  });
}

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  if (found.data.length) return found.data[0].id;
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const c = existing.data[0];
      if (c.metadata?.userId !== options.userId) {
        await stripe.customers.update(c.id, {
          metadata: { ...c.metadata, userId: options.userId },
        });
      }
      return c.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}


/** Validates a coupon against the cart contents. Returns null when no code was supplied. */
async function resolveCoupon(
  code: string | null | undefined,
  cartItems: Array<{ productId: string; quantity: number }>,
) {
  if (!code || !code.trim()) return null;
  const { data, error } = await supabaseAdmin.rpc("validate_discount_coupon_cart", {
    _code: code.trim(),
    _items: cartItems.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
  });
  if (error) throw new Error(error.message);
  const row = (data as any[] | null)?.[0];
  if (!row || row.error) {
    const reason = String(row?.error ?? "invalid");
    if (reason.startsWith("min_order:")) {
      const min = Number(reason.split(":")[1] ?? 0) / 100;
      throw new Error(`This code requires a minimum order of $${min.toFixed(2)}.`);
    }
    if (reason.startsWith("min_items:")) {
      throw new Error(
        `This code needs at least ${reason.split(":")[1]} qualifying items in your cart. Testosterone and phentermine don't count.`,
      );
    }
    const messages: Record<string, string> = {
      invalid: "That promo code is not valid.",
      expired: "That promo code has expired.",
      not_started: "That promo code is not active yet.",
      max_uses: "That promo code has reached its usage limit.",
      no_eligible_items:
        "None of the items in your cart qualify for this code. Testosterone and phentermine don't qualify.",
    };
    throw new Error(messages[reason] ?? "That promo code is not valid.");
  }
  const eligibleCents = Number(row.eligible_subtotal_cents ?? 0);
  const discountCents = Math.max(0, Math.min(eligibleCents, Number(row.discount_cents ?? 0)));
  if (discountCents <= 0) return null;
  return { code: String(row.code), discountCents };
}

export async function createCheckoutSessionHandler(data: CreateCheckoutSessionInput, context: AuthContext) {
  const { supabase, userId, claims } = context;
  const env = (data.environment ?? getStripeClientConfig().environment) as StripeEnv;
  const email = claims?.email;

  const productIds = data.items.map((i) => i.productId);
  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select(
       "id, slug, name, description, category, price_cents, requires_labs, requires_consultation, is_controlled, requires_appointment, active, pharmacy, supplies_available, supplies_price_cents, telehealth_addon_available, telehealth_addon_price_cents, bac_water_available, bac_water_price_cents, purchase_ack_text",
     )
    .in("id", productIds);
  if (productsError) throw new Error(productsError.message);
  if (!products || products.length !== productIds.length) {
    throw new Error("One or more products are unavailable.");
  }
  const inactive = products.filter((p) => !p.active);
  if (inactive.length > 0) {
    throw new Error(`No longer available: ${inactive.map((p) => p.name).join(", ")}. Please remove from cart.`);
  }

  const complianceProducts = products.filter((p) => p.category !== "telehealth_visit");

  // Government-issued ID (license, state ID, or passport) is mandatory before
  // a patient's first order; it stays on file for later purchases.
  if (complianceProducts.length > 0) {
    const { count: idCount } = await supabase
      .from("patient_documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("doc_type", "id_license");
    if ((idCount ?? 0) === 0) {
      throw new Error(
        "A government-issued ID (driver's license, state ID, or passport) is required before your first order.",
      );
    }
  }

  // Standalone lab panels are an outright purchase: no intake, no approval,
  // no clinician review before checkout.
  const needsIntake = products.some(
    (p) =>
      p.category !== "telehealth_visit" &&
      p.category !== "lab_panel" &&
      (p.category === "peptides" ||
        p.category === "hormone_trt" ||
        p.category === "controlled" ||
        p.category === "bundle" ||
        p.category === "non_fda"),
  );

  if (needsIntake) {
    const { data: intake } = await supabase
      .from("intake_responses")
      .select("attestation_signed")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!intake?.attestation_signed) throw new Error("Intake not completed.");
  }

  // Each medication that requires a visit needs its OWN pre-purchase appointment.
  const apptProductIds = products
    .filter((p) => p.requires_appointment && p.category !== "telehealth_visit")
    .map((p) => p.id);
  if (apptProductIds.length > 0) {
    const { data: appts } = await supabase
      .from("appointments")
      .select("id, status, product_id")
      .eq("user_id", userId)
      .eq("purpose", "pre_purchase_consult")
      .in("status", ["scheduled", "completed"])
      .in("product_id", apptProductIds);
    const booked = new Set(
      ((appts ?? []) as Array<{ product_id: string | null }>).map((a) => a.product_id),
    );
    const missing = apptProductIds.filter((id) => !booked.has(id));
    if (missing.length > 0) {
      const names = products.filter((p) => missing.includes(p.id)).map((p) => p.name);
      throw new Error(
        `Pre-purchase appointment not booked for: ${names.join(", ")}.`,
      );
    }
  }

  const complianceProductIds = complianceProducts.map((p) => p.id);
  // Standalone lab panels only require the Laboratory Order Consent — the
  // always-required consents don't apply to a lab-only purchase.
  const labOnly =
    complianceProducts.length > 0 &&
    complianceProducts.every((p) => p.category === "lab_panel");
  const [{ data: perProduct }, { data: alwaysReq }] = complianceProductIds.length > 0
    ? await Promise.all([
        supabase
          .from("product_consents")
          .select("consent_templates!inner(id, slug, version, active, scope)")
          .in("product_id", complianceProductIds),
        labOnly
          ? Promise.resolve({ data: [] as Array<{ id: string; slug: string; version: number }> })
          : supabase
              .from("consent_templates")
              .select("id, slug, version")
              .eq("active", true)
              .eq("scope", "always_required"),
      ])
    : [{ data: [] }, { data: [] }];

  const { collectRequiredTemplates, missingConsentSlugs } = await import("@/lib/consent-verification");
  const requiredTemplates = collectRequiredTemplates(
    (perProduct ?? []) as Parameters<typeof collectRequiredTemplates>[0],
    alwaysReq ?? [],
  );

  if (requiredTemplates.size > 0) {
    const tplIds = Array.from(requiredTemplates.values()).map((t) => t.id);
    const { data: sigs } = await supabase
      .from("consent_signatures")
      .select("consent_template_id, template_version")
      .eq("user_id", userId)
      .in("consent_template_id", tplIds);
    const missing = missingConsentSlugs(requiredTemplates, sigs ?? []);
    if (missing.length > 0) throw new Error("Required consents not signed.");
  }

  const anyTelevisit = data.items.some((i) => i.addTelevisit) || products.some((p) => p.category === "telehealth_visit");
  if (anyTelevisit) {
    if (!data.televisitAppointmentId) throw new Error("Please choose a Zoom call time before payment.");
    const { data: tvAppt } = await supabase
      .from("appointments")
      .select("id")
      .eq("id", data.televisitAppointmentId)
      .eq("user_id", userId)
      .eq("purpose", "telehealth_visit")
      .in("status", ["scheduled", "completed"])
      .maybeSingle();
    if (!tvAppt) throw new Error("Please choose a Zoom call time before payment.");
  }

  const productById = new Map(products.map((p) => [p.id, p]));
  let subtotal = 0;
  const lineItems: Array<
    | { price: string; quantity: number }
    | {
        quantity: number;
        price_data: {
          currency: string;
          unit_amount: number;
          product_data: { name: string };
        };
      }
  > = [];
  // A lab panel in the cart is the product itself — it must not push the
  // order into the "awaiting labs / provider review" pipeline. Products whose
  // labs a provider already approved are resolved below.
  let requiresLabs = products.some((p) => p.requires_labs && p.category !== "lab_panel");

  const requiresConsultation = complianceProducts.some(
    (p) => p.requires_consultation && p.category !== "lab_panel",
  );

  const stripe = createStripeClient(env);
  for (const item of data.items) {
    const p = productById.get(item.productId);
    if (!p) throw new Error("One or more products are unavailable.");
    subtotal += p.price_cents * item.quantity;
    const stripePrice = await ensureStripePrice(stripe, {
      slug: p.slug,
      name: p.name,
      description: p.description,
      price_cents: p.price_cents,
    });
    lineItems.push({ price: stripePrice.id, quantity: item.quantity });

    if (item.addSupplies && p.supplies_available) {
      subtotal += p.supplies_price_cents * item.quantity;
      lineItems.push({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: p.supplies_price_cents,
          product_data: { name: `Supplies kit — ${p.name}` },
        },
      });
    }
    if (p.purchase_ack_text && !item.acknowledged) {
      throw new Error(`Required acknowledgment not confirmed for ${p.name}.`);
    }
    if (item.addBacWater && p.bac_water_available) {
      subtotal += p.bac_water_price_cents * item.quantity;
      lineItems.push({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: p.bac_water_price_cents,
          product_data: { name: `Bacteriostatic water (30 mL) — ${p.name}` },
        },
      });
    }
    if (item.addTelevisit && p.telehealth_addon_available) {
      subtotal += p.telehealth_addon_price_cents * item.quantity;
      lineItems.push({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: p.telehealth_addon_price_cents,
          product_data: { name: `Tele-visit consult — ${p.name}` },
        },
      });
    }
  }

  // Lab panels are purchased directly — no clinician approval needed to buy them.
  const labRequiredProducts = products.filter(
    (p) => p.requires_labs && p.category !== "lab_panel",
  );
  if (labRequiredProducts.length > 0) {
    const { data: approvals, error: apprErr } = await supabase
      .from("product_approvals")
      .select("product_id, status, requested_via, reviewed_at, created_at")
      .eq("user_id", userId)
      .in(
        "product_id",
        labRequiredProducts.map((p) => p.id),
      )
      .in("status", ["approved", "consumed"]);
    if (apprErr) throw new Error(apprErr.message);
    const approvedIds = new Set(
      ((approvals ?? []) as Array<{
        product_id: string;
        status: string;
        requested_via: "uploaded_labs" | "purchased_labs";
        reviewed_at: string | null;
        created_at: string | null;
      }>)
        .filter(isApprovalStillValid)
        .map((approval) => approval.product_id),
    );
    const missing = labRequiredProducts.filter((p) => !approvedIds.has(p.id));
    // No usable approval (e.g. a previous order consumed the uploaded report):
    // submit the order for lab review instead of charging or hard-failing.
    requiresLabs = missing.length > 0;
  }
  const deferForLabReview = requiresLabs;

  const coupon = await resolveCoupon(
    data.couponCode,
    data.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  );
  const discountCents = coupon?.discountCents ?? 0;


  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      status: deferForLabReview ? "awaiting_labs" : "pending",
      subtotal_cents: subtotal,
      total_cents: Math.max(0, subtotal - discountCents),
      coupon_code: coupon?.code ?? null,
      discount_cents: discountCents,
      requires_labs: requiresLabs,
      requires_consultation: requiresConsultation,
    })
    .select("id")
    .single();
  if (orderError || !order) throw new Error(orderError?.message ?? "Failed to create order");

  const itemRows = data.items.map((item) => {
    const p = productById.get(item.productId);
    if (!p) throw new Error("One or more products are unavailable.");
    const addOns: Record<string, { price_cents: number }> = {};
    if (item.addSupplies && p.supplies_available) {
      addOns.supplies = { price_cents: p.supplies_price_cents };
    }
    if (item.addTelevisit && p.telehealth_addon_available) {
      addOns.televisit = { price_cents: p.telehealth_addon_price_cents };
    }
    if (item.addBacWater && p.bac_water_available) {
      addOns.bac_water = { price_cents: p.bac_water_price_cents };
    }
    return {
      order_id: order.id,
      product_id: p.id,
      quantity: item.quantity,
      unit_price_cents: p.price_cents,
      product_name_snapshot: p.name,
      product_category_snapshot: p.category,
      pharmacy_snapshot: p.pharmacy,
      add_ons: addOns,
    };
  });
  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(itemRows);
  if (itemsError) throw new Error(itemsError.message);

  await supabaseAdmin.from("order_events").insert({
    order_id: order.id,
    actor_id: userId,
    event_type: "order.created",
    to_status: deferForLabReview ? "awaiting_labs" : "pending",
  });

  // Nothing is charged until a provider reviews the labs for this order.
  if (deferForLabReview) {
    return { mode: "lab_review" as const, checkoutUrl: null, orderId: order.id };
  }

  for (const p of labRequiredProducts) {
    await supabaseAdmin.rpc("consume_approval_for_order", {
      _user_id: userId,
      _product_id: p.id,
      _order_id: order.id,
    });
  }

  const customerId = await resolveOrCreateCustomer(stripe, { email, userId });
  const discounts = coupon
    ? [
        {
          coupon: (
            await stripe.coupons.create({
              amount_off: discountCents,
              currency: "usd",
              duration: "once",
              name: `Promo ${coupon.code}`,
              metadata: { code: coupon.code, orderId: order.id },
            })
          ).id,
        },
      ]
    : undefined;
  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "payment",
    customer: customerId,
    success_url: data.returnUrl,
    cancel_url: data.returnUrl,
    automatic_tax: { enabled: true },
    customer_update: { address: "auto", name: "auto" },
    ...(discounts ? { discounts } : {}),
    metadata: { userId, orderId: order.id, couponCode: coupon?.code ?? "" },
    payment_intent_data: { metadata: { userId, orderId: order.id } },
  });

  await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
  if (coupon) {
    await supabaseAdmin.rpc("increment_coupon_use", { _code: coupon.code });
  }

  if (!session.url) throw new Error("Unable to start checkout.");
  return {
    mode: "stripe" as const,
    checkoutUrl: session.url as string | null,
    orderId: order.id,
  };
}

export async function createPaymentSessionForApprovedOrderHandler(data: PayApprovedOrderInput, context: AuthContext) {
  const { supabase, userId, claims } = context;
  const email = claims?.email;
  const env = (data.environment ?? getStripeClientConfig().environment) as StripeEnv;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, user_id, status, total_cents, paid_at, stripe_session_id, coupon_code, discount_cents")
    .eq("id", data.orderId)
    .maybeSingle();
  if (orderErr) throw new Error(orderErr.message);
  if (!order) throw new Error("Order not found");
  if (order.status !== "approved") {
    throw new Error("Order is not approved for payment yet.");
  }
  if (order.paid_at) throw new Error("This order has already been paid.");

  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select("quantity, unit_price_cents, product_name_snapshot, add_ons")
    .eq("order_id", order.id);
  if (itemsErr) throw new Error(itemsErr.message);
  if (!items || items.length === 0) throw new Error("Order has no items.");

  const stripe = createStripeClient(env);
  const approvedOrderItems = items as Array<{
    quantity: number;
    unit_price_cents: number;
    product_name_snapshot: string;
    add_ons: unknown;
  }>;
  const lineItems: Array<{
    quantity: number;
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string };
    };
  }> = approvedOrderItems.map((it) => ({
    quantity: it.quantity,
    price_data: {
      currency: "usd",
      unit_amount: it.unit_price_cents,
      product_data: { name: it.product_name_snapshot },
    },
  }));
  for (const it of approvedOrderItems) {
    const addOns = (it.add_ons ?? {}) as Record<string, { price_cents?: number }>;
    if (addOns.supplies?.price_cents) {
      lineItems.push({
        quantity: it.quantity,
        price_data: {
          currency: "usd",
          unit_amount: addOns.supplies.price_cents,
          product_data: { name: `Supplies kit — ${it.product_name_snapshot}` },
        },
      });
    }
    if (addOns.televisit?.price_cents) {
      lineItems.push({
        quantity: it.quantity,
        price_data: {
          currency: "usd",
          unit_amount: addOns.televisit.price_cents,
          product_data: { name: `Tele-visit — ${it.product_name_snapshot}` },
        },
      });
    }
  }

  const customerId = await resolveOrCreateCustomer(stripe, { email, userId });
  const orderDiscountCents = Number((order as any).discount_cents ?? 0);
  const orderDiscounts =
    orderDiscountCents > 0
      ? [
          {
            coupon: (
              await stripe.coupons.create({
                amount_off: orderDiscountCents,
                currency: "usd",
                duration: "once",
                name: `Promo ${(order as any).coupon_code ?? ""}`.trim(),
                metadata: { orderId: order.id },
              })
            ).id,
          },
        ]
      : undefined;
  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "payment",
    customer: customerId,
    success_url: data.returnUrl,
    cancel_url: data.returnUrl,
    automatic_tax: { enabled: true },
    customer_update: { address: "auto", name: "auto" },
    ...(orderDiscounts ? { discounts: orderDiscounts } : {}),
    metadata: { userId, orderId: order.id },
    payment_intent_data: { metadata: { userId, orderId: order.id } },
  });

  await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

  if (!session.url) throw new Error("Unable to start payment.");
  return { checkoutUrl: session.url, orderId: order.id };
}

export async function getOrderStatusHandler(data: z.infer<typeof orderStatusInputSchema>, context: AuthContext) {
  const { supabase } = context;
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, paid_at, total_cents, requires_labs, requires_consultation")
    .eq("id", data.orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { order };
}