import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";
import type { RefillEligibility } from "@/lib/refills";

type AuthContext = {
  supabase: any;
  userId: string;
  claims: { email?: string } | null;
};

export const productIdInputSchema = z.object({ productId: z.string().uuid() });

export const createRefillPaymentInputSchema = z.object({
  productId: z.string().uuid(),
  environment: z.enum(["sandbox", "live"]),
});

export const finalizeRefillInputSchema = z.object({
  productId: z.string().uuid(),
  paymentIntentId: z.string().min(3).max(120),
  note: z.string().max(1000).optional(),
  environment: z.enum(["sandbox", "live"]),
});

export const adminDecideRefillInputSchema = z.object({
  refillId: z.string().uuid(),
  decision: z.enum(["approved", "declined"]),
  reason: z.string().max(1000).optional(),
  environment: z.enum(["sandbox", "live"]),
});

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

/**
 * A refill is only offered once the patient has:
 *  - bought and paid for this medication at least once,
 *  - completed the mandatory pre-purchase visit for it, and
 *  - had their baseline blood work approved.
 * Refill count is capped by `products.refills_allowed`.
 */
export async function getRefillEligibilityHandler(
  data: { productId: string },
  context: AuthContext,
): Promise<RefillEligibility> {
  const { userId } = context;

  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select("id, name, price_cents, active, refills_allowed, refill_note, requires_appointment, requires_labs")
    .eq("id", data.productId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const p = product as {
    id: string;
    name: string;
    price_cents: number;
    active: boolean;
    refills_allowed: number | null;
    refill_note: string | null;
    requires_appointment: boolean;
    requires_labs: boolean;
  } | null;

  const base = {
    supported: false,
    qualified: false,
    allowed: 0,
    used: 0,
    remaining: 0,
    pending: false,
    amountCents: p?.price_cents ?? 0,
    productName: p?.name ?? "",
    refillNote: p?.refill_note ?? null,
    blockedReason: null as string | null,
  };

  if (!p || !p.active) return base;
  const allowed = p.refills_allowed ?? 0;
  if (!p.requires_appointment || allowed <= 0) {
    return {
      ...base,
      allowed,
      refillNote: p.refill_note,
      blockedReason:
        allowed <= 0 && p.requires_appointment
          ? "This medication has no refills — a new telehealth visit and updated blood work are required for each order."
          : null,
    };
  }

  const [{ data: orders }, { data: appts }, { data: approvals }, { data: requests }] =
    await Promise.all([
      supabaseAdmin
        .from("order_items")
        .select("order_id, orders!inner(user_id, paid_at, status)")
        .eq("product_id", p.id)
        .eq("orders.user_id", userId)
        .not("orders.paid_at", "is", null)
        .limit(1),
      supabaseAdmin
        .from("appointments")
        .select("id, status")
        .eq("user_id", userId)
        .eq("product_id", p.id)
        .in("status", ["scheduled", "completed"])
        .limit(1),
      supabaseAdmin
        .from("product_approvals")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", p.id)
        .in("status", ["approved", "consumed"])
        .limit(1),
      supabaseAdmin
        .from("refill_requests")
        .select("id, status")
        .eq("user_id", userId)
        .eq("product_id", p.id),
    ]);

  const rows = (requests ?? []) as Array<{ status: string }>;
  const used = rows.filter((r) => r.status === "approved").length;
  const pending = rows.some((r) => r.status === "pending");
  const remaining = Math.max(0, allowed - used);

  let blockedReason: string | null = null;
  if (!orders?.length) blockedReason = "Refills unlock after your first paid order of this medication.";
  else if (p.requires_appointment && !appts?.length)
    blockedReason = "Complete your initial telehealth visit for this medication first.";
  else if (p.requires_labs && !approvals?.length)
    blockedReason = "Your baseline blood work must be reviewed and approved first.";
  else if (remaining === 0)
    blockedReason =
      "You've used all available refills. Updated blood work and a follow-up telehealth visit are required to continue.";

  return {
    supported: true,
    qualified: !blockedReason,
    allowed,
    used,
    remaining,
    pending,
    amountCents: p.price_cents,
    productName: p.name,
    refillNote: p.refill_note,
    blockedReason,
  };
}

/** Authorise (manual capture) the refill amount — nothing is captured yet. */
export async function createRefillPaymentHandler(
  data: z.infer<typeof createRefillPaymentInputSchema>,
  context: AuthContext,
) {
  const eligibility = await getRefillEligibilityHandler({ productId: data.productId }, context);
  if (!eligibility.supported || !eligibility.qualified) {
    throw new Error(eligibility.blockedReason ?? "Refills are not available for this medication.");
  }
  if (eligibility.pending) throw new Error("You already have a refill request pending review.");

  const stripe = createStripeClient(data.environment as StripeEnv);
  const customerId = await resolveCustomer(stripe, {
    email: context.claims?.email,
    userId: context.userId,
  });

  const intent = await stripe.paymentIntents.create({
    amount: eligibility.amountCents,
    currency: "usd",
    customer: customerId,
    capture_method: "manual",
    description: `Refill request — ${eligibility.productName}`,
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: {
      userId: context.userId,
      kind: "refill_request",
      productId: data.productId,
    },
  });

  return {
    clientSecret: intent.client_secret as string,
    paymentIntentId: intent.id,
    amountCents: eligibility.amountCents,
    productName: eligibility.productName,
  };
}

/** Open the provider review request once the authorisation is in place. */
export async function finalizeRefillRequestHandler(
  data: z.infer<typeof finalizeRefillInputSchema>,
  context: AuthContext,
) {
  const { userId } = context;
  const stripe = createStripeClient(data.environment as StripeEnv);

  const intent = await stripe.paymentIntents.retrieve(data.paymentIntentId);
  if (intent.metadata?.["userId"] !== userId || intent.metadata?.["kind"] !== "refill_request") {
    throw new Error("Payment not found.");
  }
  if (intent.metadata?.["productId"] !== data.productId) {
    throw new Error("Payment does not match this medication.");
  }
  if (intent.status !== "requires_capture") {
    throw new Error("The card authorisation did not complete.");
  }

  const eligibility = await getRefillEligibilityHandler({ productId: data.productId }, context);
  if (eligibility.pending) return { status: "pending" as const };

  const { error } = await supabaseAdmin.from("refill_requests").insert({
    user_id: userId,
    product_id: data.productId,
    status: "pending",
    sequence: eligibility.used + 1,
    amount_cents: intent.amount,
    payment_intent: intent.id,
    patient_note: data.note ?? null,
  } as never);
  if (error) throw new Error(error.message);

  return { status: "pending" as const };
}

/** PATIENT: every refill this patient has requested. */
export async function listMyRefillsHandler(context: AuthContext) {
  const { data, error } = await supabaseAdmin
    .from("refill_requests")
    .select("id, status, sequence, amount_cents, reason, created_at, reviewed_at, order_id, products(name, slug)")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { refills: data ?? [] };
}

/** STAFF: review queue. */
export async function adminListRefillsHandler(data: { status: string }) {
  let query = supabaseAdmin
    .from("refill_requests")
    .select(
      "id, user_id, status, sequence, amount_cents, patient_note, reason, created_at, reviewed_at, order_id, products(name, slug, pharmacy)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (data.status !== "all") query = query.eq("status", data.status);
  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  const userIds = Array.from(new Set((rows ?? []).map((r: any) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds)
    : { data: [] as any[] };
  const nameByUser = new Map(
    ((profiles ?? []) as any[]).map((p) => [
      p.user_id,
      `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Patient",
    ]),
  );

  return {
    refills: (rows ?? []).map((r: any) => ({
      ...r,
      patient_name: nameByUser.get(r.user_id) ?? "Patient",
    })),
  };
}

/**
 * STAFF: approve (capture the authorisation + create the order) or decline
 * (release the authorisation, patient is never charged).
 */
export async function adminDecideRefillHandler(
  data: z.infer<typeof adminDecideRefillInputSchema>,
  context: AuthContext,
) {
  const { data: row, error } = await supabaseAdmin
    .from("refill_requests")
    .select("id, user_id, product_id, status, amount_cents, payment_intent, sequence")
    .eq("id", data.refillId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const refill = row as {
    id: string;
    user_id: string;
    product_id: string;
    status: string;
    amount_cents: number;
    payment_intent: string | null;
    sequence: number;
  } | null;
  if (!refill) throw new Error("Refill request not found.");
  if (refill.status !== "pending") throw new Error("This request has already been reviewed.");

  const stripe = createStripeClient(data.environment as StripeEnv);
  const now = new Date().toISOString();

  if (data.decision === "declined") {
    if (refill.payment_intent) {
      try {
        await stripe.paymentIntents.cancel(refill.payment_intent);
      } catch {
        /* already released or expired */
      }
    }
    const { error: uErr } = await supabaseAdmin
      .from("refill_requests")
      .update({
        status: "declined",
        reason: data.reason ?? "Refill declined by provider.",
        reviewed_by: context.userId,
        reviewed_at: now,
      } as never)
      .eq("id", refill.id);
    if (uErr) throw new Error(uErr.message);
    return { status: "declined" as const };
  }

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id, name, category, price_cents, pharmacy")
    .eq("id", refill.product_id)
    .maybeSingle();
  const p = product as {
    id: string;
    name: string;
    category: string;
    price_cents: number;
    pharmacy: string | null;
  } | null;
  if (!p) throw new Error("Product unavailable.");

  if (!refill.payment_intent) throw new Error("No card authorisation on this request.");
  const captured = await stripe.paymentIntents.capture(refill.payment_intent);
  if (captured.status !== "succeeded") throw new Error("Card capture failed — ask the patient to re-submit.");

  const { data: order, error: oErr } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: refill.user_id,
      status: "approved",
      subtotal_cents: refill.amount_cents,
      total_cents: refill.amount_cents,
      requires_labs: false,
      requires_consultation: false,
      has_recent_labs: true,
      stripe_payment_intent: refill.payment_intent,
      paid_at: now,
      reviewed_by: context.userId,
      reviewed_at: now,
      provider_notes: `Refill #${refill.sequence} approved.`,
    } as never)
    .select("id")
    .single();
  if (oErr || !order) throw new Error(oErr?.message ?? "Failed to create the refill order.");

  await supabaseAdmin.from("order_items").insert({
    order_id: (order as { id: string }).id,
    product_id: p.id,
    quantity: 1,
    unit_price_cents: refill.amount_cents,
    product_name_snapshot: p.name,
    product_category_snapshot: p.category,
    pharmacy_snapshot: p.pharmacy,
    add_ons: {},
  } as never);

  await supabaseAdmin.from("order_events").insert({
    order_id: (order as { id: string }).id,
    actor_id: context.userId,
    event_type: "refill.approved",
    to_status: "approved",
    notes: `Refill #${refill.sequence} approved — authorisation captured (${refill.payment_intent}).`,
  } as never);

  const { error: uErr } = await supabaseAdmin
    .from("refill_requests")
    .update({
      status: "approved",
      captured_at: now,
      order_id: (order as { id: string }).id,
      reviewed_by: context.userId,
      reviewed_at: now,
      reason: data.reason ?? null,
    } as never)
    .eq("id", refill.id);
  if (uErr) throw new Error(uErr.message);

  return { status: "approved" as const, orderId: (order as { id: string }).id };
}
