import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, XCircle, FlaskConical } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PayApprovedOrderForm } from "@/components/StripeEmbeddedCheckout";


export const Route = createFileRoute("/account_/orders/$orderId")({
  head: () => ({ meta: [{ title: "Order — Wellness Med Club" }] }),
  component: OrderDetail,
});

type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  subtotal_cents: number;
  created_at: string;
  paid_at: string | null;
  requires_labs: boolean;
  requires_consultation: boolean;
  rejected_reason: string | null;
};

type ItemRow = {
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  unit_price_cents: number;
};

type EventRow = {
  id: string;
  event_type: string;
  to_status: string | null;
  notes: string | null;
  created_at: string;
};

function OrderDetail() {
  const { orderId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [productSlug, setProductSlug] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: o }, { data: it }, { data: ev }] = await Promise.all([
        supabase
          .from("orders")
          .select(
            "id, status, total_cents, subtotal_cents, created_at, paid_at, requires_labs, requires_consultation, rejected_reason",
          )
          .eq("id", orderId)
          .maybeSingle(),
        supabase
          .from("order_items")
          .select("product_id, product_name_snapshot, quantity, unit_price_cents")
          .eq("order_id", orderId),
        supabase
          .from("order_events")
          .select("id, event_type, to_status, notes, created_at")
          .eq("order_id", orderId)
          .order("created_at", { ascending: true }),
      ]);
      const firstProductId = it?.[0]?.product_id;
      const { data: product } = firstProductId
        ? await supabase.from("products").select("slug").eq("id", firstProductId).maybeSingle()
        : { data: null };
      setOrder(o);
      setItems(it ?? []);
      setProductSlug(product?.slug ?? null);
      setEvents(ev ?? []);
      setLoading(false);
    })();
  }, [user, orderId]);

  if (loading)
    return (
      <SiteLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );

  if (!order)
    return (
      <SiteLayout>
        <PageHero eyebrow="order" title="Order not found" />
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <Link to="/account/orders" className="underline text-xs uppercase tracking-[0.22em]">
            Back to orders
          </Link>
        </div>
      </SiteLayout>
    );

  const showPayNow = order.status === "approved" && !order.paid_at;
  const showAwaitingLabs = order.status === "awaiting_labs";
  const showRejected = order.status === "rejected";

  return (
    <SiteLayout>
      <PageHero
        eyebrow={`order #${order.id.slice(0, 8).toUpperCase()}`}
        title={order.status.replace(/_/g, " ")}
        subtitle={new Date(order.created_at).toLocaleString()}
      />
      <section className="mx-auto max-w-3xl px-6 pb-24 grid gap-8">
        {showAwaitingLabs && (
          <div className="border border-amber-200 bg-amber-50 p-5 text-sm space-y-3">
            <div className="flex items-center gap-2 font-serif text-lg text-amber-900">
              <FlaskConical className="h-5 w-5" /> Pending lab review — no charge yet
            </div>
            <p className="text-amber-900/80 leading-relaxed">
              Your order includes medication that requires updated labs. We will
              not charge your card until a licensed provider reviews and approves
              your labs. Labs must be less than 6 months old.
            </p>
            <ol className="list-decimal ml-5 space-y-1 text-amber-900/80">
              <li>Upload your existing labs, or purchase a lab package.</li>
              <li>
                Once labs are on file, a provider schedules a review. If you
                ordered labs, we will contact you to book the review after
                results are back.
              </li>
              <li>
                If approved, this page will show a <strong>Pay now</strong>{" "}
                button and your order will be released for shipping.
              </li>
            </ol>
            <div className="flex gap-2 pt-2">
              <Link
                to="/account/documents"
                search={{ product: productSlug ?? undefined }}
                className="inline-flex items-center border border-amber-800/40 text-amber-900 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:bg-amber-100"
              >
                Upload labs / ID
              </Link>
              <Link
                to="/products"
                search={{ category: "lab_panel" } as never}
                className="inline-flex items-center border border-amber-800/40 text-amber-900 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:bg-amber-100"
              >
                Purchase a lab package
              </Link>
            </div>
          </div>
        )}

        {showPayNow && (
          <div className="border border-accent/40 bg-accent/5 p-5 space-y-4">
            <div className="flex items-center gap-2 font-serif text-lg text-accent">
              <CheckCircle2 className="h-5 w-5" /> Labs approved — complete payment
            </div>
            <p className="text-sm text-foreground/80">
              Your provider approved your labs. Pay now to release your order
              for pharmacy processing.
            </p>
            <PayApprovedOrderForm
              orderId={order.id}
              returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
            />
          </div>
        )}

        {showRejected && (
          <div className="border border-destructive/40 bg-destructive/5 p-5 text-sm">
            <div className="flex items-center gap-2 font-serif text-lg text-destructive mb-2">
              <XCircle className="h-5 w-5" /> Order cancelled after lab review
            </div>
            {order.rejected_reason && (
              <p>
                <strong>Reason from provider:</strong> {order.rejected_reason}
              </p>
            )}
            <p className="mt-2 text-muted-foreground">
              Your card was not charged. Reach out if you have questions.
            </p>
          </div>
        )}

        {order.status === "pending" && !order.paid_at && (
          <div className="border border-border bg-secondary/40 p-4 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <span>Your order was created but hasn't been paid yet.</span>
          </div>
        )}

        <div>
          <h2 className="font-serif text-xl mb-3">Items</h2>
          <ul className="border border-border divide-y divide-border">
            {items.map((i, idx) => (
              <li key={idx} className="flex justify-between px-4 py-3 text-sm">
                <span>
                  {i.product_name_snapshot}{" "}
                  <span className="text-muted-foreground">× {i.quantity}</span>
                </span>
                <span>${((i.unit_price_cents * i.quantity) / 100).toFixed(2)}</span>
              </li>
            ))}
            <li className="flex justify-between px-4 py-3 font-serif text-base">
              <span>Total</span>
              <span>${(order.total_cents / 100).toFixed(2)}</span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl mb-3">Timeline</h2>
          <ol className="border border-border divide-y divide-border">
            {events.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground">No events yet.</li>
            )}
            {events.map((e) => (
              <li key={e.id} className="px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{e.event_type.replace(/[._]/g, " ")}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </div>
                {e.to_status && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    → {e.to_status.replace(/_/g, " ")}
                  </div>
                )}
                {e.notes && <div className="text-xs mt-1">{e.notes}</div>}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </SiteLayout>
  );
}

