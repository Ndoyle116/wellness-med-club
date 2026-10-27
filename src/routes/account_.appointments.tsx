import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2, Video } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth, PortalLoading, PortalError } from "@/lib/use-require-auth";

export const Route = createFileRoute("/account_/appointments")({
  head: () => ({
    meta: [
      { title: "My Appointments — Wellness Med Club" },
      {
        name: "description",
        content:
          "View your upcoming and past telehealth appointments with the Wellness Med Club clinical team.",
      },
      { property: "og:title", content: "My Appointments — Wellness Med Club" },
      {
        property: "og:description",
        content: "Upcoming and past telehealth visits in your patient portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppointmentsPage,
});

type Row = {
  id: string;
  status: string;
  purpose: string | null;
  scheduled_for: string | null;
  external_booking_url: string | null;
  notes: string | null;
  products: { name: string; slug: string } | null;
};

const PURPOSE_LABEL: Record<string, string> = {
  pre_purchase_consult: "Pre-purchase consultation",
  telehealth_visit: "Telehealth visit",
  lab_review: "Lab review",
  follow_up: "Follow-up visit",
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  no_show: "Missed",
  cancelled: "Cancelled",
};

function AppointmentsPage() {
  const { user, ready } = useRequireAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setError(false);
    const { data, error: err } = await supabase
      .from("appointments")
      .select(
        "id, status, purpose, scheduled_for, external_booking_url, notes, products(name, slug)",
      )
      .eq("user_id", user.id)
      .order("scheduled_for", { ascending: false, nullsFirst: false });
    if (err) {
      setError(true);
      return;
    }
    setRows((data ?? []) as unknown as Row[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (!ready) {
    return (
      <SiteLayout>
        <PortalLoading />
      </SiteLayout>
    );
  }

  const now = Date.now();
  const upcoming = (rows ?? []).filter(
    (r) =>
      r.status === "scheduled" &&
      r.scheduled_for &&
      new Date(r.scheduled_for).getTime() > now,
  );
  const past = (rows ?? []).filter((r) => !upcoming.includes(r));

  return (
    <SiteLayout>
      <PageHero
        eyebrow="patient portal"
        title="My appointments"
        subtitle="Your telehealth visits with the Wellness Med Club clinical team."
      />
      <section className="mx-auto max-w-4xl px-6 py-16">
        {error ? (
          <PortalError
            message="We couldn't load your appointments right now."
            onRetry={load}
          />
        ) : !rows ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            <Group title="Upcoming" rows={upcoming} empty="No upcoming visits scheduled." />
            {past.length > 0 && <Group title="Past & cancelled" rows={past} />}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function Group({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: Row[];
  empty?: string;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl mb-4">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="divide-y divide-border border border-border bg-background">
          {rows.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {a.scheduled_for
                    ? new Date(a.scheduled_for).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "Time to be confirmed"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {PURPOSE_LABEL[a.purpose ?? ""] ?? "Consultation"}
                  {a.products?.name ? ` · ${a.products.name}` : ""}
                </p>
                {a.external_booking_url && a.status === "scheduled" && (
                  <a
                    href={a.external_booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] font-semibold border-b border-foreground pb-0.5 hover:text-accent hover:border-accent"
                  >
                    <Video className="h-3.5 w-3.5" /> Join visit
                  </a>
                )}
                {a.notes && (
                  <p className="mt-2 text-xs text-muted-foreground">{a.notes}</p>
                )}
              </div>
              <span
                className={`text-[11px] uppercase tracking-[0.16em] px-3 py-1 border ${
                  a.status === "scheduled"
                    ? "border-emerald-600 text-emerald-700"
                    : a.status === "cancelled" || a.status === "no_show"
                      ? "border-destructive text-destructive"
                      : "border-border text-muted-foreground"
                }`}
              >
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-border bg-secondary/40 p-8 text-center">
      <CalendarClock className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
        You don't have any appointments yet. Visits are scheduled as part of the
        medication you're ordering — open the product you need and, once your
        labs are reviewed, you'll be able to choose a time with your provider.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          to="/products"
          className="px-5 py-3 text-xs uppercase tracking-[0.18em] font-semibold bg-ink text-primary-foreground hover:bg-accent transition-colors"
        >
          Browse medications
        </Link>
        <Link
          to="/account/approvals"
          className="px-5 py-3 text-xs uppercase tracking-[0.18em] font-semibold border border-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          View lab approvals
        </Link>
      </div>
    </div>
  );
}
