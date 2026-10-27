import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({ meta: [{ title: "Order received — Wellness Med Club" }] }),
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  component: ReturnPage,
});

type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  paid_at: string | null;
  requires_labs: boolean;
  requires_consultation: boolean;
};

function ReturnPage() {
  const { session_id } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const { clear } = useCart();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  // Poll for the webhook to mark the order paid
  useEffect(() => {
    if (!user || !session_id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      const { data } = await supabase
        .from("orders")
        .select("id, status, total_cents, paid_at, requires_labs, requires_consultation")
        .eq("stripe_session_id", session_id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setOrder(data);
        if (data.paid_at) {
          clear();
          setLoading(false);
          return;
        }
      }
      if (attempts < 15) setTimeout(tick, 1500);
      else setLoading(false);
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [user, session_id, clear]);

  return (
    <SiteLayout>
      <PageHero eyebrow="order" title="Thank you" subtitle="Your payment has been received." />
      <section className="mx-auto max-w-2xl px-6 pb-24">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Confirming your order…
          </div>
        ) : !order ? (
          <p className="text-sm text-muted-foreground">
            We couldn't locate your order. If you were charged, contact support.
          </p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-accent">
              <CheckCircle2 className="h-6 w-6" />
              <span className="font-serif text-2xl text-foreground">Order confirmed</span>
            </div>
            <dl className="border border-border divide-y divide-border text-sm">
              <Row label="Order ID" value={order.id.slice(0, 8).toUpperCase()} />
              <Row label="Total" value={`$${(order.total_cents / 100).toFixed(2)}`} />
              <Row label="Status" value={humanStatus(order.status)} />
            </dl>
            <p className="text-sm text-muted-foreground">
              {nextStepCopy(order)}
            </p>
            <div className="flex gap-3">
              <Link
                to="/account/orders/$orderId"
                params={{ orderId: order.id }}
                className="inline-flex items-center bg-ink text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors"
              >
                View order
              </Link>
              <Link
                to="/account"
                className="inline-flex items-center border border-border px-5 py-2.5 text-xs uppercase tracking-[0.22em] hover:bg-secondary transition-colors"
              >
                My account
              </Link>
            </div>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-3">
      <dt className="text-muted-foreground uppercase text-xs tracking-[0.22em]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function humanStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function nextStepCopy(order: OrderRow): string {
  if (order.status === "awaiting_labs")
    return "Next step: a lab requisition will be sent to your email and posted to your account.";
  if (order.status === "awaiting_consultation")
    return "Next step: a clinician will reach out to schedule your consultation within 1 business day.";
  if (order.status === "under_review")
    return "Next step: a clinician is reviewing your order. You'll be notified when it's approved.";
  return "We're processing your order. You'll receive updates via email.";
}
