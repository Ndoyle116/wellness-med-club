import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";

/**
 * Inline lab-panel payment.
 *
 * The patient pays the lab fee immediately with a Stripe Payment Element on the
 * product page, and the medication order is placed at the same time. The
 * medication amount is only AUTHORISED (manual capture) — the money is taken
 * when a clinician approves the lab results.
 *
 * Flow:
 *  1. `createLabPanelPaymentHandler` creates the order (awaiting_labs), a
 *     pending `purchased_labs` approval, and a PaymentIntent for the LAB FEE
 *     with `setup_future_usage: off_session` so the card can be reused.
 *  2. The Payment Element confirms that intent → lab charged instantly.
 *  3. `finalizeLabPanelPaymentHandler` places a manual-capture authorisation on
 *     the same card for the medication total.
 *  4. `captureHoldsForApproval` (called from the admin approval) captures it.
 */

export const createLabPanelPaymentInputSchema = z.object({
  productId: z.string().uuid(),
  panelProductId: z.string().uuid(),
  quantity: z.number().int().min(1).max(12).default(1),
  addSupplies: z.boolean().optional(),
  addBacWater: z.boolean().optional(),
  environment: z.enum(["sandbox", "live"]),
});

export const finalizeLabPanelPaymentInputSchema = z.object({
  orderId: z.string().uuid(),
  environment: z.enum(["sandbox", "live"]),
});

type CreateInput = z.infer<typeof createLabPanelPaymentInputSchema>;
type FinalizeInput = z.infer<typeof finalizeLabPanelPaymentInputSchema>;

type AuthContext = {
  supabase: any;
  userId: string;
  claims: { email?: string } | null;
};

async function resolveCustomer(
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
    if (existing.data.length) return existing.data[0].id;
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}

export async function createLabPanelPaymentHandler(
  data: CreateInput,
  context: AuthContext,
) {
  const { supabase, userId, claims } = context;
  const env = data.environment as StripeEnv;

  const { data: rows, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, slug, name, category, price_cents, active, pharmacy, requires_labs, requires_consultation, supplies_available, supplies_price_cents, bac_water_available, bac_water_price_cents",
    )
    .in("id", [data.productId, data.panelProductId]);
  if (error) throw new Error(error.message);

  const medication = rows?.find((p) => p.id === data.productId);
  const panel = rows?.find((p) => p.id === data.panelProductId);
  if (!medication?.active || !panel?.active) throw new Error("Product unavailable.");
  if (panel.category !== "lab_panel") throw new Error("Selected product is not a lab panel.");
  if (!medication.requires_labs) throw new Error("This product does not require lab review.");

  // Government-issued ID must be on file before the first purchase.
  const { count: idCount } = await supabase
    .from("patient_documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("doc_type", "id_license");
  if ((idCount ?? 0) === 0) {
    throw new Error(
      "A government-issued ID (driver's license, state ID, or passport) is required before your first purchase.",
    );
  }

  // Medication total (held, not charged today).
  let medicationTotal = medication.price_cents * data.quantity;
  const addOns: Record<string, { price_cents: number }> = {};
  if (data.addSupplies && medication.supplies_available) {
    medicationTotal += medication.supplies_price_cents * data.quantity;
    addOns.supplies = { price_cents: medication.supplies_price_cents };
  }
  if (data.addBacWater && medication.bac_water_available) {
    medicationTotal += medication.bac_water_price_cents * data.quantity;
    addOns.bac_water = { price_cents: medication.bac_water_price_cents };
  }
  const labTotal = panel.price_cents;

  // Only the lab panel is being purchased at this step, so only the lab's own
  // consent is required here. Medication + always-required consents are still
  // enforced at /checkout before the medication is dispensed.
  const { data: perProduct } = await supabase
    .from("product_consents")
    .select("consent_templates!inner(id, slug, version, active, scope)")
    .eq("product_id", panel.id);

  const { collectRequiredTemplates, missingConsentSlugs } = await import(
    "@/lib/consent-verification"
  );
  const requiredTemplates = collectRequiredTemplates(
    (perProduct ?? []) as Parameters<typeof collectRequiredTemplates>[0],
    [],
  );
  if (requiredTemplates.size > 0) {
    const { data: sigs } = await supabase
      .from("consent_signatures")
      .select("consent_template_id, template_version")
      .eq("user_id", userId)
      .in(
        "consent_template_id",
        Array.from(requiredTemplates.values()).map((t) => t.id),
      );
    if (missingConsentSlugs(requiredTemplates, sigs ?? []).length > 0) {
      throw new Error(
        "Please review and sign the required consent forms before paying (Account → Consents).",
      );
    }
  }


  // NOTE: the clinician-facing approval request is NOT created here — it is
  // created in finalizeLabPanelPaymentHandler once the lab fee actually
  // succeeds. Creating it before payment produced phantom "pending" reviews
  // for abandoned checkouts.


  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      status: "awaiting_labs",
      subtotal_cents: medicationTotal + labTotal,
      total_cents: medicationTotal + labTotal,
      requires_labs: true,
      requires_consultation: Boolean(medication.requires_consultation),
    })
    .select("id")
    .single();
  if (orderError || !order) throw new Error(orderError?.message ?? "Failed to create order");

  const { error: itemsError } = await supabaseAdmin.from("order_items").insert([
    {
      order_id: order.id,
      product_id: panel.id,
      quantity: 1,
      unit_price_cents: panel.price_cents,
      product_name_snapshot: panel.name,
      product_category_snapshot: panel.category,
      pharmacy_snapshot: panel.pharmacy,
      add_ons: {},
    },
    {
      order_id: order.id,
      product_id: medication.id,
      quantity: data.quantity,
      unit_price_cents: medication.price_cents,
      product_name_snapshot: medication.name,
      product_category_snapshot: medication.category,
      pharmacy_snapshot: medication.pharmacy,
      add_ons: addOns,
    },
  ]);
  if (itemsError) throw new Error(itemsError.message);

  const stripe = createStripeClient(env);
  const customerId = await resolveCustomer(stripe, { email: claims?.email, userId });

  const intent = await stripe.paymentIntents.create({
    amount: labTotal,
    currency: "usd",
    customer: customerId,
    // Reuse the card for the medication authorisation created right after.
    setup_future_usage: "off_session",
    description: `${panel.name} — lab fee`,
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId,
      orderId: order.id,
      kind: "lab_fee",
      medicationProductId: medication.id,
      medicationTotal: String(medicationTotal),
    },
  });

  await supabaseAdmin
    .from("orders")
    .update({ lab_payment_intent: intent.id, stripe_payment_intent: intent.id } as never)
    .eq("id", order.id);

  await supabaseAdmin.from("order_events").insert({
    order_id: order.id,
    actor_id: userId,
    event_type: "lab_fee.payment_started",
    to_status: "awaiting_labs",
    notes: `${panel.name} — ${(labTotal / 100).toFixed(2)} USD charged today; ${(medicationTotal / 100).toFixed(2)} USD held for ${medication.name}.`,
  });

  return {
    orderId: order.id,
    clientSecret: intent.client_secret as string,
    labTotalCents: labTotal,
    medicationTotalCents: medicationTotal,
    panelName: panel.name,
    medicationName: medication.name,
  };
}

/**
 * Called once the Payment Element reports the lab fee succeeded. Places the
 * manual-capture authorisation for the medication on the same card.
 */
export async function finalizeLabPanelPaymentHandler(
  data: FinalizeInput,
  context: AuthContext,
) {
  const { userId } = context;
  const env = data.environment as StripeEnv;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, status, lab_payment_intent, hold_payment_intent")
    .eq("id", data.orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = order as unknown as {
    id: string;
    user_id: string;
    lab_payment_intent: string | null;
    hold_payment_intent: string | null;
  } | null;
  if (!row || row.user_id !== userId) throw new Error("Order not found.");
  if (row.hold_payment_intent) return { held: true as const };
  if (!row.lab_payment_intent) throw new Error("No lab payment on this order.");

  const stripe = createStripeClient(env);
  const labIntent = await stripe.paymentIntents.retrieve(row.lab_payment_intent);
  if (labIntent.status !== "succeeded") {
    return { held: false as const, reason: "Lab payment not completed yet." };
  }

  await supabaseAdmin.from("order_events").insert({
    order_id: row.id,
    actor_id: userId,
    event_type: "lab_fee.paid",
    notes: `Lab fee charged (${labIntent.id}).`,
  });

  // Now that the lab fee is actually paid, open the clinician review request.
  const medicationProductId = labIntent.metadata?.["medicationProductId"];
  if (medicationProductId) {
    const { data: existingApproval } = await supabaseAdmin
      .from("product_approvals")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", medicationProductId)
      .in("status", ["pending", "approved"])
      .maybeSingle();
    if (!existingApproval) {
      await supabaseAdmin.from("product_approvals").insert({
        user_id: userId,
        product_id: medicationProductId,
        status: "pending",
        requested_via: "purchased_labs",
      });
    }
  }



  const medicationTotal = Number(labIntent.metadata?.["medicationTotal"] ?? 0);
  const paymentMethod =
    typeof labIntent.payment_method === "string"
      ? labIntent.payment_method
      : labIntent.payment_method?.id;
  const customer =
    typeof labIntent.customer === "string" ? labIntent.customer : labIntent.customer?.id;
  if (!medicationTotal || !paymentMethod || !customer) {
    return { held: false as const, reason: "Card could not be saved for the medication hold." };
  }

  try {
    const hold = await stripe.paymentIntents.create({
      amount: medicationTotal,
      currency: "usd",
      customer,
      payment_method: paymentMethod,
      off_session: true,
      confirm: true,
      capture_method: "manual",
      description: "Medication — held until lab review is approved",
      metadata: { userId, orderId: row.id, kind: "medication_hold" },
    });
    await supabaseAdmin
      .from("orders")
      .update({ hold_payment_intent: hold.id } as never)
      .eq("id", row.id);
    await supabaseAdmin.from("order_events").insert({
      order_id: row.id,
      actor_id: userId,
      event_type: "medication.authorized",
      notes: `Authorised ${(medicationTotal / 100).toFixed(2)} USD — captured on lab approval (${hold.id}).`,
    });
    return { held: true as const };
  } catch (e) {
    await supabaseAdmin.from("order_events").insert({
      order_id: row.id,
      actor_id: userId,
      event_type: "medication.authorization_failed",
      notes: e instanceof Error ? e.message : "Authorisation failed",
    });
    return {
      held: false as const,
      reason: "Your lab fee was charged. The medication hold could not be placed — you'll be asked to pay after approval.",
    };
  }
}

/**
 * ADMIN: capture the medication hold(s) for a patient/product once the lab
 * review is approved. Best-effort — an expired hold leaves the order payable.
 */
export async function captureHoldsForApproval(options: {
  userId: string;
  productId: string;
  environment?: StripeEnv;
}) {
  const env: StripeEnv = options.environment ?? "live";
  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("order_id")
    .eq("product_id", options.productId);
  const orderIds = Array.from(new Set((items ?? []).map((i) => i.order_id)));
  if (orderIds.length === 0) return;

  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, status, hold_payment_intent, hold_captured_at, total_cents")
    .in("id", orderIds)
    .eq("user_id", options.userId)
    .eq("status", "awaiting_labs");

  const rows = (orders ?? []) as unknown as Array<{
    id: string;
    hold_payment_intent: string | null;
    hold_captured_at: string | null;
  }>;
  const pending = rows.filter((o) => o.hold_payment_intent && !o.hold_captured_at);
  if (pending.length === 0) return;

  const stripe = createStripeClient(env);
  for (const o of pending) {
    try {
      await stripe.paymentIntents.capture(o.hold_payment_intent as string);
      await supabaseAdmin
        .from("orders")
        .update({
          hold_captured_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          status: "approved",
        } as never)
        .eq("id", o.id);
      await supabaseAdmin.from("order_events").insert({
        order_id: o.id,
        event_type: "medication.captured",
        to_status: "approved",
        notes: "Lab review approved — held medication amount captured.",
      });
    } catch (e) {
      await supabaseAdmin.from("order_events").insert({
        order_id: o.id,
        event_type: "medication.capture_failed",
        notes: e instanceof Error ? e.message : "Capture failed",
      });
    }
  }
}

export const labPurchaseConsentsInputSchema = z.object({
  productId: z.string().uuid(),
  panelProductId: z.string().uuid(),
});

/**
 * The exact consent set the lab-panel charge gate will require, with the
 * patient's current signature status. Same computation as
 * `createLabPanelPaymentHandler` so the dialog can never disagree with it.
 */
export async function getLabPurchaseConsentsHandler(
  data: z.infer<typeof labPurchaseConsentsInputSchema>,
  context: AuthContext,
) {
  const { supabase, userId } = context;

  const { data: perProduct } = await supabase
    .from("product_consents")
    .select("consent_templates!inner(id, slug, version, active, scope)")
    .eq("product_id", data.panelProductId);

  const { collectRequiredTemplates } = await import("@/lib/consent-verification");
  const required = collectRequiredTemplates(
    (perProduct ?? []) as Parameters<typeof collectRequiredTemplates>[0],
    [],
  );
  const ids = Array.from(required.values()).map((t) => t.id);
  if (ids.length === 0) return { consents: [] as Array<Record<string, unknown>> };

  const [{ data: templates }, { data: sigs }] = await Promise.all([
    supabase
      .from("consent_templates")
      .select("id, slug, title, body, version, scope")
      .in("id", ids),
    supabase
      .from("consent_signatures")
      .select("consent_template_id, template_version")
      .eq("user_id", userId)
      .in("consent_template_id", ids),
  ]);

  const signed = new Set(
    (sigs ?? [])
      .filter((s: { consent_template_id: string; template_version: number }) =>
        Array.from(required.values()).some(
          (t) => t.id === s.consent_template_id && t.version === s.template_version,
        ),
      )
      .map((s: { consent_template_id: string }) => s.consent_template_id),
  );

  return {
    consents: (templates ?? []).map(
      (t: {
        id: string;
        slug: string;
        title: string;
        body: string;
        version: number;
        scope: "always_required" | "per_product";
      }) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        body: t.body,
        version: t.version,
        scope: t.scope,
        signed: signed.has(t.id),
      }),
    ),
  };
}
