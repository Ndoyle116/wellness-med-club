import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getStripeConfig } from "@/lib/stripe-config.functions";

export function PaymentTestModeBanner() {
  const fetchConfig = useServerFn(getStripeConfig);
  const [isSandbox, setIsSandbox] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await fetchConfig({});
        if (!cancelled) setIsSandbox(config.environment === "sandbox");
      } catch {
        if (!cancelled) setIsSandbox(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchConfig]);

  if (isSandbox !== true) return null;
  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-sm text-orange-800">
      Payments are in Stripe test mode. No real charges are made.
    </div>
  );
}
