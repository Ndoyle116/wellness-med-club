// Server-only helper for order status emails (received / approved / rejected).
// Best effort: callers wrap in try/catch, and sendEmail never throws.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendEmail } from "@/lib/email.server";
import { button, esc, shell, siteUrl } from "@/lib/notification-emails.server";

type Kind = "received" | "approved" | "rejected";

const p = (html: string) =>
  `<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:#3a3a3a">${html}</p>`;

export async function sendOrderEmail(opts: { orderId: string; kind: Kind; reason?: string }) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, total_cents, created_at")
    .eq("id", opts.orderId)
    .maybeSingle();
  if (!order) return;

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_name_snapshot, quantity, unit_price_cents")
    .eq("order_id", opts.orderId);

  const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
  const email = userRes?.user?.email;
  if (!email) return;

  const orderNumber = opts.orderId.slice(0, 8).toUpperCase();
  const total = ((order.total_cents ?? 0) / 100).toFixed(2);
  const orderUrl = `${siteUrl()}/account/orders/${opts.orderId}`;
  const lines = (items ?? []).map((i) => ({
    name: i.product_name_snapshot,
    quantity: i.quantity,
    price: ((i.unit_price_cents * i.quantity) / 100).toFixed(2),
  }));
  const itemsHtml = lines.length
    ? `<table role="presentation" width="100%" style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#3a3a3a;border-top:1px solid #e6e1d8;margin:18px 0">${lines
        .map(
          (l) =>
            `<tr><td style="padding:8px 0">${esc(l.name)} × ${l.quantity}</td><td align="right" style="padding:8px 0">$${l.price}</td></tr>`,
        )
        .join(
          "",
        )}<tr><td style="padding:8px 0;border-top:1px solid #e6e1d8"><strong>Total</strong></td><td align="right" style="padding:8px 0;border-top:1px solid #e6e1d8"><strong>$${total}</strong></td></tr></table>`
    : "";
  const itemsText = lines.map((l) => `- ${l.name} x${l.quantity}: $${l.price}`).join("\n");

  const content = {
    received: {
      subject: `We received your order #${orderNumber}`,
      heading: "Thank you — your order is in",
      intro:
        "We received your payment. Your provider will review your order and you'll hear from us at each step.",
    },
    approved: {
      subject: `Your order #${orderNumber} was approved`,
      heading: "Your order was approved",
      intro:
        "Your provider reviewed and approved your order. We'll let you know as soon as it moves forward.",
    },
    rejected: {
      subject: `Update on your order #${orderNumber}`,
      heading: "Your order needs attention",
      intro: "Your provider was not able to approve your order at this time.",
    },
  }[opts.kind];

  const reasonHtml =
    opts.kind === "rejected" && opts.reason
      ? p(`<strong>Note from your clinician:</strong> ${esc(opts.reason)}`)
      : "";

  const html = shell(`
    <h1 style="font-size:26px;margin:0 0 14px;font-weight:400">${content.heading}</h1>
    ${p(`${content.intro}<br />Order <strong>#${orderNumber}</strong>`)}
    ${reasonHtml}
    ${itemsHtml}
    <p style="margin:26px 0">${button(orderUrl, "View your order")}</p>`);

  const text = [
    content.heading,
    content.intro,
    `Order #${orderNumber}`,
    opts.kind === "rejected" && opts.reason ? `Note from your clinician: ${opts.reason}` : "",
    itemsText,
    `Total: $${total}`,
    `View your order: ${orderUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  await sendEmail({
    to: email,
    subject: content.subject,
    html,
    text,
    label: `order-${opts.kind}`,
    idempotencyKey: `order-${opts.kind}-${opts.orderId}`,
  });
}
