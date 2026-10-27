import Stripe from "stripe";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

/** "sandbox" = Stripe test mode, "live" = real payments. Decided by the key itself. */
export type StripeEnv = "sandbox" | "live";

/**
 * Stripe client using the business's own Stripe secret key (STRIPE_SECRET_KEY).
 * The `env` argument is kept for call-site compatibility; the key decides the mode.
 */
export function createStripeClient(_env?: StripeEnv): Stripe {
  return new Stripe(getEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2026-03-25.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

/** Signing secret of the Stripe webhook endpoint pointing at /api/public/payments/webhook. */
export function getWebhookSecret(_env?: StripeEnv): string {
  return getEnv("STRIPE_WEBHOOK_SECRET");
}

export function getStripeErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as { message?: string; raw?: { message?: string } };
    return e.raw?.message ?? e.message ?? "Stripe request failed";
  }
  return "Stripe request failed";
}
