import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw } from "lucide-react";
import { listMyRefills } from "@/lib/refills.functions";
import { formatMoney } from "@/lib/refills";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useRequireAuth, PortalLoading, PortalError } from "@/lib/use-require-auth";

export const Route = createFileRoute("/account_/refills")({
  head: () => ({
    meta: [
      { title: "My Refills — Wellness Med Club" },
      {
        name: "description",
        content:
          "Track testosterone and phentermine refill requests, their provider review status, and charges.",
      },
      { property: "og:title", content: "My Refills — Wellness Med Club" },
      {
        property: "og:description",
        content: "Refill requests are reviewed by your provider before any charge is made.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RefillsPage,
});

type Row = {
  id: string;
  status: string;
  sequence: number;
  amount_cents: number;
  reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  order_id: string | null;
  products: { name: string; slug: string } | null;
};

const LABEL: Record<string, string> = {
  pending: "Pending Provider Review and Approval",
  approved: "Approved & charged",
  declined: "Declined — not charged",
  cancelled: "Cancelled",
};

function RefillsPage() {
  const { ready } = useRequireAuth();
  const listFn = useServerFn(listMyRefills);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false);
    return listFn({})
      .then((r) => setRows((r as { refills: Row[] }).refills))
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) {
    return (
      <SiteLayout>
        <PortalLoading />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <main className="mx-auto w-full max-w-4xl px-6 py-14">
        <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Patient portal</p>
        <h1 className="mt-2 font-serif text-3xl">My refills</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Refills are available for eligible testosterone and phentermine products after your
          initial telehealth visit and baseline blood work. Every request is pending provider
          review — your card is authorised at request and charged only on approval.
        </p>

        <div className="mt-8">
          {loadError ? (
            <PortalError
              message="We couldn't load your refill requests right now."
              onRetry={load}
            />
          ) : !rows ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="border border-border bg-secondary/40 p-8 text-center">
              <RefreshCw className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No refill requests yet. Open a medication you already take to request a refill.
              </p>
              <Link
                to="/products"
                className="mt-5 inline-block px-5 py-3 text-xs uppercase tracking-[0.18em] font-semibold bg-ink text-primary-foreground hover:bg-accent transition-colors"
              >
                Browse medications
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border border border-border bg-background">
              {rows.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium">
                      {r.products?.name ?? "Medication"}{" "}
                      <span className="text-muted-foreground">— refill #{r.sequence}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Requested {new Date(r.created_at).toLocaleDateString()} ·{" "}
                      {formatMoney(r.amount_cents)}
                    </p>
                    {r.reason && (
                      <p className="mt-1 text-xs text-destructive">{r.reason}</p>
                    )}
                  </div>
                  <span
                    className={`text-[11px] uppercase tracking-[0.16em] px-3 py-1 border ${
                      r.status === "approved"
                        ? "border-emerald-600 text-emerald-700"
                        : r.status === "declined"
                          ? "border-destructive text-destructive"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {LABEL[r.status] ?? r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </SiteLayout>
  );
}
