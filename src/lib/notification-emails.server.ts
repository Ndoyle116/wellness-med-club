// Server-only helpers for patient notification emails (sent via Resend).

import { sendEmail } from "@/lib/email.server";

export const SITE_NAME = "Wellness Med Club";

export function siteUrl(): string {
  return (process.env["PUBLIC_SITE_URL"] ?? "https://wellnessmedclub.com").replace(/\/$/, "");
}

/** Escape text that came from users or the database before putting it in email HTML. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function shell(body: string) {
  return `<!doctype html><html><body style="margin:0;background:#FCFAF6;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#1c1c1c">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e6e1d8" cellpadding="0" cellspacing="0">
      <tr><td style="padding:28px 32px">
        <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#8a8378;margin-bottom:18px">${SITE_NAME}</div>
        ${body}
      </td></tr>
    </table>
    <div style="max-width:560px;margin-top:16px;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#8a8378">
      This message relates to your care at ${SITE_NAME}.
    </div>
  </td></tr></table></body></html>`;
}

export function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#1c1c1c;color:#ffffff;text-decoration:none;padding:14px 26px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase">${label}</a>`;
}

/** Send a patient email. Best effort: never throws. */
export async function queuePatientEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  label: string;
  /** Stable per-event key so retries never duplicate a send. */
  idempotencyKey: string;
}) {
  await sendEmail(opts);
}

/** Lab-approval decision email with a direct link back to the product page. */
export async function sendApprovalDecisionEmail(opts: {
  email: string;
  decision: "approved" | "disapproved";
  productName: string;
  productSlug?: string | null;
  reason?: string | null;
  approvalId?: string | null;
  decisionVersion?: string | null;
}) {
  const base = siteUrl();
  const link = opts.productSlug
    ? `${base}/products/${opts.productSlug}`
    : `${base}/account/approvals`;
  const key = [
    "approval",
    opts.decision,
    opts.approvalId ?? crypto.randomUUID(),
    opts.decisionVersion ?? "initial",
  ].join("-");

  if (opts.decision === "approved") {
    const html = shell(`
      <h1 style="font-size:26px;margin:0 0 14px;font-weight:400">Great news — your labs were approved</h1>
      <p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:#3a3a3a">
        Your provider reviewed your lab work for <strong>${esc(opts.productName)}</strong> and approved you for treatment.
        You can move forward with your purchase using the link below — no need to search for the product again.
      </p>
      <p style="margin:26px 0">${button(link, "Move forward with your purchase")}</p>
      <p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:#8a8378">
        If the button doesn't work, copy this link into your browser:<br />${link}
      </p>`);
    await queuePatientEmail({
      to: opts.email,
      subject: `Your labs were approved — complete your ${opts.productName} purchase`,
      html,
      text: `Great news — your labs for ${opts.productName} were approved. Move forward with your purchase: ${link}`,
      label: "approval-approved",
      idempotencyKey: key,
    });
    return;
  }

  const html = shell(`
    <h1 style="font-size:26px;margin:0 0 14px;font-weight:400">Your lab review needs attention</h1>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:#3a3a3a">
      Your provider reviewed your lab work for <strong>${esc(opts.productName)}</strong> and was not able to approve it at this time.
      ${opts.reason ? `<br /><br /><strong>Note from your clinician:</strong> ${esc(opts.reason)}` : ""}
    </p>
    <p style="margin:26px 0">${button(`${base}/account/approvals`, "View your lab review")}</p>`);
  await queuePatientEmail({
    to: opts.email,
    subject: `Update on your lab review for ${opts.productName}`,
    html,
    text: `Your lab review for ${opts.productName} was not approved. ${opts.reason ?? ""} View details: ${base}/account/approvals`,
    label: "approval-disapproved",
    idempotencyKey: key,
  });
}
