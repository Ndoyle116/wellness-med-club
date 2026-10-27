import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import { createStripeClient, getWebhookSecret, type StripeEnv } from "@/lib/stripe.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type OrderStatus =
  | "pending"
  | "awaiting_intake"
  | "awaiting_labs"
  | "awaiting_consultation"
  | "under_review"
  | "approved"
  | "rejected"
  | "prescription_sent"
  | "fulfilled"
  | "cancelled";

async function transitionPaidOrder(orderId: string) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, status, requires_labs, requires_consultation, paid_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) {
    console.error(`[webhook] order not found: ${orderId}`);
    return;
  }
  if (order.paid_at) return; // idempotent

  // Lab panels bought on their own are complete at payment — nothing to review.
  const { data: allItems } = await supabaseAdmin
    .from("order_items")
    .select("product_id, product_name_snapshot, product_category_snapshot")
    .eq("order_id", orderId);
  const items = allItems ?? [];
  const labItems = items.filter((li) => li.product_category_snapshot === "lab_panel");
  const labsOnly = items.length > 0 && labItems.length === items.length;

  // Smart routing: labs first, then consultation, else provider review
  const next: OrderStatus = labsOnly
    ? "fulfilled"
    : order.requires_labs
    ? "awaiting_labs"
    : order.requires_consultation
    ? "awaiting_consultation"
    : "under_review";

  const fromStatus = order.status as OrderStatus;
  await supabaseAdmin
    .from("orders")
    .update({ status: next, paid_at: new Date().toISOString() })
    .eq("id", orderId);

  await supabaseAdmin.from("order_events").insert([
    {
      order_id: orderId,
      event_type: "payment.succeeded",
      from_status: fromStatus,
      to_status: next,
    },
  ]);

  // Fire "order received" email (best-effort)
  try {
    const { sendOrderEmail } = await import("@/lib/order-emails.server");
    await sendOrderEmail({ orderId, kind: "received" });
  } catch (e) {
    console.error("[webhook] order-received email failed", e);
  }

  // Create lab_orders rows for any lab_panel items in the order
  if (labItems.length) {
    await supabaseAdmin.from("lab_orders").insert(
      labItems.map((li) => ({
        user_id: order.user_id,
        order_id: orderId,
        product_id: li.product_id,
        panel_name: li.product_name_snapshot,
        status: "pending" as const,
      })),
    );
  }

  // Create a placeholder appointment if a consultation is required
  if (order.requires_consultation) {
    await supabaseAdmin.from("appointments").insert({
      user_id: order.user_id,
      order_id: orderId,
      status: "scheduled",
    });
  }
}

async function markOrderCancelled(orderId: string, reason: string) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("status, paid_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.paid_at) return;
  await supabaseAdmin
    .from("orders")
    .update({ status: "cancelled", rejected_reason: reason })
    .eq("id", orderId);
  await supabaseAdmin.from("order_events").insert({
    order_id: orderId,
    event_type: "payment.failed",
    from_status: order.status as OrderStatus,
    to_status: "cancelled",
    notes: reason,
  });
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const envParam = url.searchParams.get("env");
        const env: StripeEnv = envParam === "live" ? "live" : "sandbox";

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });
        const body = await request.text();

        const stripe = createStripeClient(env);
        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            getWebhookSecret(env),
          );
        } catch (err) {
          console.error("[webhook] signature verification failed", err);
          return new Response("Invalid signature", { status: 401 });
        }

        try {
          switch (event.type) {
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded": {
              const session = event.data.object as Stripe.Checkout.Session;
              const orderId = session.metadata?.orderId;
              if (orderId && session.payment_status === "paid") {
                await supabaseAdmin
                  .from("orders")
                  .update({
                    stripe_payment_intent:
                      typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : session.payment_intent?.id ?? null,
                    total_cents: session.amount_total ?? undefined,
                  })
                  .eq("id", orderId);
                await transitionPaidOrder(orderId);
              }
              break;
            }
            case "checkout.session.expired":
            case "checkout.session.async_payment_failed": {
              const session = event.data.object as Stripe.Checkout.Session;
              const orderId = session.metadata?.orderId;
              if (orderId) await markOrderCancelled(orderId, `Stripe ${event.type}`);
              break;
            }
            case "payment_intent.payment_failed": {
              const pi = event.data.object as Stripe.PaymentIntent;
              const orderId = pi.metadata?.orderId;
              if (orderId)
                await markOrderCancelled(
                  orderId,
                  pi.last_payment_error?.message ?? "Payment failed",
                );
              break;
            }
            default:
              // Ignore other events
              break;
          }
        } catch (err) {
          console.error(`[webhook] handler error for ${event.type}`, err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
