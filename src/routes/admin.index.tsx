import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  ClipboardList,
  Package,
  CalendarClock,
  DollarSign,
  Clock3,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminGetDashboardStats } from "@/lib/admin-stats.functions";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Admin" }] }),
  component: AdminDashboardPage,
});

type Stats = Awaited<ReturnType<typeof adminGetDashboardStats>>;

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  awaiting_intake: "Awaiting intake",
  awaiting_labs: "Awaiting labs",
  awaiting_consultation: "Awaiting consult",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  prescription_sent: "Rx sent",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

function AdminDashboardPage() {
  const getStats = useServerFn(adminGetDashboardStats);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getStats({ data: undefined as unknown as never });
        setStats(res as Stats);
      } catch {
        // handled by error UI
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminShell eyebrow="Dashboard" title="At a glance">
      {!stats ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Clock3 className="h-4 w-4" />}
              label="Pending review"
              value={stats.kpis.pending.toString()}
              hint="Orders awaiting your action"
              accent
            />
            <StatCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Approved today"
              value={stats.kpis.approvedToday.toString()}
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Revenue (30d)"
              value={`$${(stats.kpis.revenue30Cents / 100).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`}
            />
            <StatCard
              icon={<ClipboardList className="h-4 w-4" />}
              label="Total orders"
              value={stats.kpis.totalOrders.toString()}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent orders */}
            <div className="lg:col-span-2 bg-background border border-border">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-sm uppercase tracking-[0.22em]">Recent orders</h2>
                <Link
                  to="/admin/orders"
                  className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent inline-flex items-center gap-1"
                >
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              {stats.recent.length === 0 ? (
                <p className="px-6 py-10 text-sm text-muted-foreground text-center">
                  No orders yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs uppercase tracking-[0.16em]">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium">Order</th>
                      <th className="text-left px-4 py-3 font-medium">Patient</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-right px-6 py-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((o) => (
                      <tr key={o.id} className="border-t border-border hover:bg-secondary/30">
                        <td className="px-6 py-3">
                          <div className="font-medium">#{o.id.slice(0, 8).toUpperCase()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(o.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">{o.patient_name || "—"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-6 py-3 text-right font-serif">
                          ${(o.total_cents / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pipeline + quick actions */}
            <div className="space-y-6">
              <div className="bg-background border border-border">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="text-sm uppercase tracking-[0.22em]">Pipeline · 30d</h2>
                </div>
                <div className="px-6 py-4 space-y-3">
                  {Object.entries(stats.pipeline).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity in the last 30 days.</p>
                  ) : (
                    Object.entries(stats.pipeline)
                      .sort(([, a], [, b]) => b - a)
                      .map(([status, count]) => {
                        const total = Object.values(stats.pipeline).reduce(
                          (a, b) => a + b,
                          0,
                        );
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div key={status}>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{STATUS_LABEL[status] ?? status}</span>
                              <span className="text-muted-foreground">{count}</span>
                            </div>
                            <div className="h-1.5 bg-secondary overflow-hidden">
                              <div
                                className="h-full bg-ink"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              <div className="bg-background border border-border">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="text-sm uppercase tracking-[0.22em]">Quick actions</h2>
                </div>
                <div className="p-3 space-y-1">
                  <QuickLink
                    to="/admin/orders"
                    icon={<ClipboardList className="h-4 w-4" />}
                    label="Review orders"
                    detail={`${stats.kpis.pending} pending`}
                  />
                  <QuickLink
                    to="/admin/products"
                    icon={<Package className="h-4 w-4" />}
                    label="Manage products"
                    detail={`${stats.kpis.activeProducts} active`}
                  />
                  <QuickLink
                    to="/admin/availability"
                    icon={<CalendarClock className="h-4 w-4" />}
                    label="Availability"
                    detail={`${stats.kpis.openSlots} open`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-background border p-5 ${
        accent ? "border-accent/40" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className={`h-8 w-8 grid place-items-center rounded-sm ${
            accent ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="font-serif text-3xl mt-1 leading-none">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    approved: "bg-accent/10 text-accent border-accent/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
    fulfilled: "bg-accent/10 text-accent border-accent/30",
    cancelled: "bg-secondary text-muted-foreground border-border",
  };
  const cls = tone[status] ?? "bg-secondary text-foreground border-border";
  return (
    <span
      className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${cls}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function QuickLink({
  to,
  icon,
  label,
  detail,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-3 py-2.5 rounded-sm hover:bg-secondary group"
    >
      <span className="flex items-center gap-3">
        <span className="text-muted-foreground group-hover:text-accent">{icon}</span>
        <span className="text-sm">{label}</span>
      </span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </Link>
  );
}
