import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { listMyApprovals } from "@/lib/approvals.functions";
import {
  ShieldCheck,
  ClipboardList,
  Package,
  CalendarClock,
  LogOut,
  Loader2,
  FileUp, RefreshCw,
  FlaskConical,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: "My Account — Wellness Med Club" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading, isStaff, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const listApprovals = useServerFn(listMyApprovals);
  const [counts, setCounts] = useState<{ approved: number; pending: number }>({
    approved: 0,
    pending: 0,
  });
  const [countsFailed, setCountsFailed] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setCountsFailed(false);
    listApprovals()
      .then((r) => {
        const approved = r.approvals.filter((a: any) => a.status === "approved").length;
        const pending = r.approvals.filter((a: any) => a.status === "pending").length;
        setCounts({ approved, pending });
      })
      .catch(() => setCountsFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading || !user) {
    return (
      <SiteLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero eyebrow="patient portal" title="Welcome back" subtitle={user.email ?? undefined} />
      <section className="mx-auto max-w-5xl px-6 py-16 grid md:grid-cols-2 gap-6">
        <Card icon={ClipboardList} title="Medical Intake" desc="Complete or update your intake form. Required before any order." href="/account/intake" />
        <Card icon={ShieldCheck} title="Consents" desc="Sign the general telehealth consent and review consents you've signed. Medication-specific consents are presented at checkout when you order them." href="/account/consents" />
        <Card icon={Package} title="My Orders" desc="View order history, status, and consents." href="/account/orders" />
        <Card
          icon={FlaskConical}
          title="Lab Approvals"
          desc={
            countsFailed
              ? "We couldn't load your approval status — open to check."
              : counts.approved > 0
                ? `${counts.approved} product${counts.approved === 1 ? "" : "s"} approved — ready to purchase.`
                : counts.pending > 0
                  ? `${counts.pending} request${counts.pending === 1 ? "" : "s"} under review.`
                  : "Request clinician approval for lab-required medications."
          }
          href="/account/approvals"
          dot={
            countsFailed
              ? undefined
              : counts.approved > 0
                ? "green"
                : counts.pending > 0
                  ? "amber"
                  : undefined
          }
        />
        <Card icon={RefreshCw} title="My Refills" desc="Request refills for eligible testosterone and phentermine — pending provider review and approval." href="/account/refills" />
        <Card icon={FileUp} title="Lab Results & ID" desc="Upload bloodwork for provider review and your ID (required by pharmacy for controlled substances)." href="/account/documents" />
        <Card icon={CalendarClock} title="Appointments" desc="View your upcoming and past telehealth visits." href="/account/appointments" />
        <Card icon={MessageSquare} title="Messages" desc="Secure messaging with our clinical team — replies within 24 hours." href="/account/messages" />
        <Card icon={ShieldCheck} title="Browse Products" desc="Vitamins, peptides, lab panels, hormone therapy." href="/products" />
        {isStaff && (
          <Card icon={ShieldCheck} title="Provider Dashboard" desc={isAdmin ? "Admin access — manage all orders, users, products." : "Review and approve patient orders."} href="/admin" />
        )}
      </section>
      <div className="mx-auto max-w-5xl px-6 pb-20">
        <button
          onClick={() => { signOut().then(() => navigate({ to: "/" })); }}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground border-b border-border pb-1"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </SiteLayout>
  );
}

function Card({
  icon: Icon,
  title,
  desc,
  href,
  dot,
}: {
  icon: typeof ShieldCheck;
  title: string;
  desc: string;
  href: string;
  dot?: "green" | "amber";
}) {
  return (
    <Link to={href} className="relative group bg-background border border-border p-8 hover:border-accent transition-colors">
      {dot && (
        <span
          className={`absolute top-4 right-4 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-1 rounded-full ${
            dot === "green"
              ? "bg-emerald-500/15 text-emerald-700"
              : "bg-amber-500/15 text-amber-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              dot === "green" ? "bg-emerald-500" : "bg-amber-500"
            } animate-pulse`}
          />
          {dot === "green" ? "Approved" : "Pending"}
        </span>
      )}
      <Icon className="h-7 w-7 text-accent mb-4" />
      <h3 className="font-serif text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
      <span className="mt-4 inline-block text-xs uppercase tracking-[0.22em] border-b border-foreground pb-0.5 group-hover:text-accent group-hover:border-accent">
        Open
      </span>
    </Link>
  );
}
