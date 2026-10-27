import { loadStripe, type Stripe } from "@stripe/stripe-js";

export type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const environment: StripeEnv = clientToken?.startsWith("pk_test_") ? "sandbox" : "live";

const stripePromises = new Map<string, Promise<Stripe | null>>();

/**
 * Loads Stripe.js for a publishable key. Never throws during render — callers
 * pass a key fetched from the server (falling back to the build-time token).
 */
export function getStripe(key?: string | null): Promise<Stripe | null> {
  const publishableKey = key || clientToken;
  if (!publishableKey) return Promise.resolve(null);
  let promise = stripePromises.get(publishableKey);
  if (!promise) {
    promise = loadStripe(publishableKey);
    stripePromises.set(publishableKey, promise);
  }
  return promise;
}

export function getStripeEnvironment(): StripeEnv {
  return environment;
}
