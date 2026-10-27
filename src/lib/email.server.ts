// Server-only email sender. Uses Resend (https://resend.com) over its HTTP API.
// Required env: RESEND_API_KEY, EMAIL_FROM (e.g. "Wellness Med Club <noreply@wellnessmedclub.com>").
// Every send is recorded in public.email_send_log. Never throws.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Short name shown in email_send_log, e.g. "order-received". */
  label: string;
  /** Stable per-event key so retries don't send the same email twice (Resend keeps it 24h). */
  idempotencyKey?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const messageId = input.idempotencyKey ?? crypto.randomUUID();

  const log = async (status: "sent" | "failed", error?: string) => {
    try {
      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: input.label,
        recipient_email: input.to,
        status,
        error_message: error?.slice(0, 1000) ?? null,
      });
    } catch (e) {
      console.error("[email] could not write email_send_log", e);
    }
  };

  if (!apiKey || !from) {
    console.error("[email] RESEND_API_KEY or EMAIL_FROM is not set; email not sent", input.label);
    await log("failed", "RESEND_API_KEY or EMAIL_FROM not configured");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey.slice(0, 256) } : {}),
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] send failed", input.label, res.status, body);
      await log("failed", `${res.status} ${body}`);
      return false;
    }
    await log("sent");
    return true;
  } catch (e) {
    console.error("[email] send error", input.label, e);
    await log("failed", e instanceof Error ? e.message : String(e));
    return false;
  }
}
