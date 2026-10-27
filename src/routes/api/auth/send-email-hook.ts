// Supabase Auth "Send Email Hook" (HTTPS). Supabase calls this endpoint instead of
// sending its own auth emails, so sign-up / reset / magic-link emails use the
// branded React Email templates in src/lib/email-templates and go out via Resend.
//
// Setup (Supabase dashboard → Authentication → Hooks → Send Email hook → HTTPS):
//   URL:    https://<your-domain>/api/auth/send-email-hook
//   Secret: generate one there and save it as SEND_EMAIL_HOOK_SECRET ("v1,whsec_...").
// Docs: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook

import * as React from "react";
import { render } from "@react-email/components";
import { createFileRoute } from "@tanstack/react-router";
import { sendEmail } from "@/lib/email.server";
import { SITE_NAME, siteUrl } from "@/lib/notification-emails.server";
import { SignupEmail } from "@/lib/email-templates/signup";
import { InviteEmail } from "@/lib/email-templates/invite";
import { MagicLinkEmail } from "@/lib/email-templates/magic-link";
import { RecoveryEmail } from "@/lib/email-templates/recovery";
import { EmailChangeEmail } from "@/lib/email-templates/email-change";
import { ReauthenticationEmail } from "@/lib/email-templates/reauthentication";

type HookPayload = {
  user: { email: string; new_email?: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
};

const SUBJECTS: Record<string, string> = {
  signup: "Confirm your email",
  invite: "You've been invited",
  magiclink: "Your login link",
  recovery: "Reset your password",
  email_change: "Confirm your new email",
  reauthentication: "Your verification code",
};

const TOLERANCE_SECONDS = 5 * 60;

function hookError(status: number, message: string) {
  return Response.json({ error: { http_code: status, message } }, { status });
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Verifies a Standard Webhooks signature (the format Supabase auth hooks use). */
async function verifySignature(request: Request, body: string, secret: string): Promise<boolean> {
  const id = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signatures = request.headers.get("webhook-signature");
  if (!id || !timestamp || !signatures) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) return false;

  const rawSecret = secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(rawSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = bytesToBase64(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)),
  );

  return signatures.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig || sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}

function verifyUrl(tokenHash: string, type: string, redirectTo: string): string {
  const supabaseUrl = (process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  const params = new URLSearchParams({
    token: tokenHash,
    type,
    redirect_to: redirectTo || siteUrl(),
  });
  return `${supabaseUrl}/auth/v1/verify?${params.toString()}`;
}

async function renderAndSend(opts: {
  to: string;
  type: string;
  element: React.ReactElement;
  idempotencyKey: string;
}) {
  const html = await render(opts.element);
  const text = await render(opts.element, { plainText: true });
  return sendEmail({
    to: opts.to,
    subject: SUBJECTS[opts.type] ?? "Notification",
    html,
    text,
    label: `auth-${opts.type}`,
    idempotencyKey: opts.idempotencyKey,
  });
}

export const Route = createFileRoute("/api/auth/send-email-hook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SEND_EMAIL_HOOK_SECRET;
        if (!secret) {
          console.error("[auth-email] SEND_EMAIL_HOOK_SECRET is not set");
          return hookError(500, "Server configuration error");
        }

        const body = await request.text();
        if (!(await verifySignature(request, body, secret))) {
          return hookError(401, "Invalid signature");
        }

        let payload: HookPayload;
        try {
          payload = JSON.parse(body);
        } catch {
          return hookError(400, "Invalid payload");
        }

        const { user, email_data: d } = payload;
        // Supabase sends "email" for OTP/magic-link sign-ins of existing users.
        const type = d.email_action_type === "email" ? "magiclink" : d.email_action_type;
        const site = siteUrl();
        const webhookId = request.headers.get("webhook-id") ?? crypto.randomUUID();
        const sends: Promise<boolean>[] = [];

        switch (type) {
          case "signup":
            sends.push(
              renderAndSend({
                to: user.email,
                type,
                idempotencyKey: `${webhookId}-signup`,
                element: React.createElement(SignupEmail, {
                  siteName: SITE_NAME,
                  siteUrl: site,
                  recipient: user.email,
                  confirmationUrl: verifyUrl(d.token_hash, "signup", d.redirect_to),
                }),
              }),
            );
            break;
          case "invite":
            sends.push(
              renderAndSend({
                to: user.email,
                type,
                idempotencyKey: `${webhookId}-invite`,
                element: React.createElement(InviteEmail, {
                  siteName: SITE_NAME,
                  siteUrl: site,
                  confirmationUrl: verifyUrl(d.token_hash, "invite", d.redirect_to),
                }),
              }),
            );
            break;
          case "magiclink":
            sends.push(
              renderAndSend({
                to: user.email,
                type,
                idempotencyKey: `${webhookId}-magiclink`,
                element: React.createElement(MagicLinkEmail, {
                  siteName: SITE_NAME,
                  confirmationUrl: verifyUrl(d.token_hash, d.email_action_type, d.redirect_to),
                }),
              }),
            );
            break;
          case "recovery":
            sends.push(
              renderAndSend({
                to: user.email,
                type,
                idempotencyKey: `${webhookId}-recovery`,
                element: React.createElement(RecoveryEmail, {
                  siteName: SITE_NAME,
                  confirmationUrl: verifyUrl(d.token_hash, "recovery", d.redirect_to),
                }),
              }),
            );
            break;
          case "reauthentication":
            sends.push(
              renderAndSend({
                to: user.email,
                type,
                idempotencyKey: `${webhookId}-reauth`,
                element: React.createElement(ReauthenticationEmail, { token: d.token }),
              }),
            );
            break;
          case "email_change": {
            const newEmail = user.new_email ?? "";
            // With "secure email change" on, Supabase sends two hashes: token_hash_new
            // belongs to the CURRENT address and token_hash to the NEW one.
            if (d.token_hash_new) {
              sends.push(
                renderAndSend({
                  to: user.email,
                  type,
                  idempotencyKey: `${webhookId}-change-current`,
                  element: React.createElement(EmailChangeEmail, {
                    siteName: SITE_NAME,
                    oldEmail: user.email,
                    email: user.email,
                    newEmail,
                    confirmationUrl: verifyUrl(d.token_hash_new, "email_change", d.redirect_to),
                  }),
                }),
              );
            }
            if (newEmail) {
              sends.push(
                renderAndSend({
                  to: newEmail,
                  type,
                  idempotencyKey: `${webhookId}-change-new`,
                  element: React.createElement(EmailChangeEmail, {
                    siteName: SITE_NAME,
                    oldEmail: user.email,
                    email: newEmail,
                    newEmail,
                    confirmationUrl: verifyUrl(d.token_hash, "email_change", d.redirect_to),
                  }),
                }),
              );
            }
            break;
          }
          default:
            console.error("[auth-email] unknown email type", d.email_action_type);
            return hookError(400, `Unknown email type: ${d.email_action_type}`);
        }

        const results = await Promise.all(sends);
        if (results.some((ok) => !ok)) return hookError(500, "Failed to send email");
        return Response.json({});
      },
    },
  },
});
