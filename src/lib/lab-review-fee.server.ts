import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";
import { MANUAL_LAB_REVIEW_FEE_CENTS } from "@/lib/lab-review-fee";

/**
 * Manual lab review fee.
 *
 * Uploading outside blood work is not free: a clinician still has to read and
 * sign off on it. The patient pays a flat $20 review fee with a Payment
 * Element inside the upload dialog, and the clinician-facing approval request
 * is only opened once that charge succeeds.
 */

export const createManualLabReviewPaymentInputSchema = z.object({
  productId: z.string().uuid(),
  documentIds: z.array(z.string().uuid()).max(20).default([]),
  environment: z.enum(["sandbox", "live"]),
});

export const finalizeManualLabReviewPaymentInputSchema = z.object({
  paymentIntentId: z.string().min(3).max(120),
  productId: z.string().uuid(),
  documentIds: z.array(z.string().uuid()).max(20).default([]),
  environment: z.enum(["sandbox", "live"]),
});

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

export async function createManualLabReviewPaymentHandler(
  data: z.infer<typeof createManualLabReviewPaymentInputSchema>,
  context: AuthContext,
) {
  const { supabase, userId, claims } = context;
  const env = data.environment as StripeEnv;

  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select("id, name, active, requires_labs")
    .eq("id", data.productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!product?.active) throw new Error("Product unavailable.");
  if (!product.requires_labs) throw new Error("This product does not require lab review.");

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

  const stripe = createStripeClient(env);
  const customerId = await resolveCustomer(stripe, { email: claims?.email, userId });

  const intent = await stripe.paymentIntents.create({
    amount: MANUAL_LAB_REVIEW_FEE_CENTS,
    currency: "usd",
    customer: customerId,
    description: `Manual lab review — ${product.name}`,
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId,
      kind: "manual_lab_review",
      productId: product.id,
    },
  });

  return {
    clientSecret: intent.client_secret as string,
    paymentIntentId: intent.id,
    amountCents: MANUAL_LAB_REVIEW_FEE_CENTS,
    productName: product.name as string,
  };
}

/**
 * Verifies the $20 review fee actually succeeded, then opens (or merges into)
 * the clinician review request for the uploaded documents.
 */
export async function finalizeManualLabReviewPaymentHandler(
  data: z.infer<typeof finalizeManualLabReviewPaymentInputSchema>,
  context: AuthContext,
) {
  const { userId } = context;
  const stripe = createStripeClient(data.environment as StripeEnv);

  const intent = await stripe.paymentIntents.retrieve(data.paymentIntentId);
  if (intent.metadata?.["userId"] !== userId || intent.metadata?.["kind"] !== "manual_lab_review") {
    throw new Error("Payment not found.");
  }
  if (intent.metadata?.["productId"] !== data.productId) {
    throw new Error("Payment does not match this product.");
  }
  if (intent.status !== "succeeded") {
    throw new Error("The review fee has not been paid yet.");
  }

  const note = `Manual lab review fee paid — $${(
    MANUAL_LAB_REVIEW_FEE_CENTS / 100
  ).toFixed(2)} (${intent.id}).`;

  const { data: existing } = await supabaseAdmin
    .from("product_approvals")
    .select("id, status, document_ids")
    .eq("user_id", userId)
    .eq("product_id", data.productId)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existing) {
    const merged = Array.from(
      new Set([...(((existing as { document_ids?: string[] }).document_ids) ?? []), ...data.documentIds]),
    );
    await supabaseAdmin
      .from("product_approvals")
      .update({
        document_ids: merged,
        requested_via: "uploaded_labs",
        patient_note: note,
      } as never)
      .eq("id", (existing as { id: string }).id);
    return { status: (existing as { status: string }).status };
  }

  const { data: prior } = await supabaseAdmin
    .from("product_approvals")
    .select("id, reason")
    .eq("user_id", userId)
    .eq("product_id", data.productId)
    .eq("status", "disapproved")
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (prior) {
    await supabaseAdmin
      .from("product_approvals")
      .update({
        status: "pending",
        reason: null,
        previous_reason: (prior as { reason: string | null }).reason,
        patient_note: note,
        requested_via: "uploaded_labs",
        document_ids: data.documentIds,
        resubmitted_at: new Date().toISOString(),
      } as never)
      .eq("id", (prior as { id: string }).id);
    return { status: "pending" };
  }

  await supabaseAdmin.from("product_approvals").insert({
    user_id: userId,
    product_id: data.productId,
    status: "pending",
    requested_via: "uploaded_labs",
    patient_note: note,
    document_ids: data.documentIds,
  } as never);

  return { status: "pending" };
}
