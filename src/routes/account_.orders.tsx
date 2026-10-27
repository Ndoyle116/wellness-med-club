import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account_/orders")({
  head: () => ({ meta: [{ title: "My orders — Wellness Med Club" }] }),
  component: OrdersPage,
});

type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  paid_at: string | null;
};

function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status, total_cents, created_at, paid_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <SiteLayout>
      <PageHero eyebrow="account" title="My orders" />
      <section className="mx-auto max-w-4xl px-6 pb-24">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No orders yet.{" "}
            <Link to="/products" className="underline">
              Browse products
            </Link>
            .
          </p>
        ) : (
          <ul className="border border-border divide-y divide-border">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  to="/account/orders/$orderId"
                  params={{ orderId: o.id }}
                  className="flex items-center justify-between px-5 py-4 hover:bg-secondary transition-colors"
                >
                  <div>
                    <div className="font-medium">#{o.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      {o.status.replace(/_/g, " ")}
                    </span>
                    <span className="font-serif">${(o.total_cents / 100).toFixed(2)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </SiteLayout>
  );
}
