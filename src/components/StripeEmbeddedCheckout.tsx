import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import {
  createCheckoutSession,
  createPaymentSessionForApprovedOrder,
} from "@/lib/checkout.functions";
import { getStripeConfig } from "@/lib/stripe-config.functions";

interface CartCheckoutProps {
  items: Array<{
    productId: string;
    quantity: number;
    addSupplies?: boolean;
    addBacWater?: boolean;
    acknowledged?: boolean;
    addTelevisit?: boolean;
  }>;
  returnUrl: string;
  televisitAppointmentId?: string | null;
  couponCode?: string | null;
}

/**
 * Stripe's hosted checkout refuses to render inside an iframe (it shows an
 * endless grey skeleton). When the app is framed — e.g. the editor preview —
 * escape to the top window, falling back to a new tab if that is blocked.
 */
function goToStripe(url: string) {
  const framed = typeof window !== "undefined" && window.top !== window.self;
  if (!framed) {
    window.location.href = url;
    return;
  }
  try {
    if (window.top) {
      window.top.location.href = url;
      return;
    }
  } catch {
    // cross-origin parent — fall through
  }
  window.open(url, "_blank", "noopener");
}

/**
 * Creates a checkout session from the current cart and redirects the patient
 * to Stripe's hosted checkout page.
 */
export function StripeEmbeddedCheckoutForm({ items, returnUrl, televisitAppointmentId = null, couponCode = null }: CartCheckoutProps) {
  const create = useServerFn(createCheckoutSession);
  const fetchConfig = useServerFn(getStripeConfig);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await fetchConfig({});
        if (cancelled) return;
        const res = await create({
          data: { items, returnUrl, environment: config.environment, televisitAppointmentId, couponCode },
        });
        if (cancelled) return;
        // Lab review pending: the order is submitted, nothing is charged yet.
        if (res.mode === "lab_review" || !res.checkoutUrl) {
          navigate({ to: "/account/orders/$orderId", params: { orderId: res.orderId } });
          return;
        }
        goToStripe(res.checkoutUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to start checkout");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <p className="p-4 text-sm text-destructive">{error}</p>;
  }
  return (
    <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to secure checkout…
    </div>
  );
}

/**
 * Starts payment for an ALREADY-APPROVED order (labs reviewed and approved by
 * a provider) by redirecting to Stripe's hosted checkout page.
 */
export function PayApprovedOrderForm({
  orderId,
  returnUrl,
}: {
  orderId: string;
  returnUrl: string;
}) {
  const create = useServerFn(createPaymentSessionForApprovedOrder);
  const fetchConfig = useServerFn(getStripeConfig);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await fetchConfig({});
        if (cancelled) return;
        const res = await create({
          data: { orderId, returnUrl, environment: config.environment },
        });
        if (!cancelled) goToStripe(res.checkoutUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to start payment");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (error) return <p className="p-4 text-sm text-destructive">{error}</p>;
  return (
    <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to secure payment…
    </div>
  );
}
