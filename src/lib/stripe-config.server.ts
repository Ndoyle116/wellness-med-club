export type StripeClientConfig = {
  publishableKey: string | null;
  environment: "sandbox" | "live";
};

/** Publishable keys are safe to expose to the browser. */
export function getStripeClientConfig(): StripeClientConfig {
  const publishableKey =
    process.env["STRIPE_PUBLISHABLE_KEY"] ||
    process.env["VITE_STRIPE_PUBLISHABLE_KEY"] ||
    null;

  const secret = process.env["STRIPE_SECRET_KEY"] || "";
  const environment: "sandbox" | "live" =
    publishableKey?.startsWith("pk_test_") || secret.startsWith("sk_test_")
      ? "sandbox"
      : "live";

  return { publishableKey, environment };
}
