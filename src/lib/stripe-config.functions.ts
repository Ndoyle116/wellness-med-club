import { createServerFn } from "@tanstack/react-start";
import { getStripeClientConfig } from "@/lib/stripe-config.server";

/** Returns the browser-safe Stripe publishable key and the active environment. */
export const getStripeConfig = createServerFn({ method: "GET" }).handler(async () =>
  getStripeClientConfig(),
);
