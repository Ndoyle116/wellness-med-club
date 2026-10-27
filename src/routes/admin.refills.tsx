import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminListRefills, adminDecideRefill } from "@/lib/refills.functions";
import { getStripeConfig } from "@/lib/stripe-config.functions";
import { formatMoney } from "@/lib/refills";

type Row = {
  id: string;
  user_id: string;
  status: string;
  sequence: number;
  amount_cents: number;
  patient_note: string | null;
  reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  patient_name: string;
  products: { name: string; slug: string; pharmacy: string | null } | null;
};

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "declined", label: "Declined" },
  { key: "all", label: "All" },
] as const;

export const Route = createFileRoute("/admin/refills")({
  head: () => ({ meta: [{ title: "Refill Requests — Admin" }] }),
  component: AdminRefillsPage,
});

function AdminRefillsPage() {
  const listFn = useServerFn(adminListRefills);
  const decideFn = useServerFn(adminDecideRefill);
  const configFn = useServerFn(getStripeConfig);
  const [status, setStatus] = useState<(typeof TABS)[number]["key"]>("pending");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [env, setEnv] = useState<"sandbox" | "live">("sandbox");
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = () =>
    listFn({ data: { status } }).then((r) => setRows((r as { refills: Row[] }).refills));

  useEffect(() => {
    configFn({}).then((c) => setEnv((c as any).environment));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRows(null);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const decide = async (row: Row, decision: "approved" | "declined") => {
    let reason: string | undefined;
    if (decision === "declined") {
      reason = window.prompt("Reason for declining (shown to the patient):") ?? "";
      if (!reason.trim()) return;
    } else if (
      !window.confirm(
        `Approve refill #${row.sequence} and charge ${formatMoney(row.amount_cents)} now?`,
      )
    ) {
      return;
    }
    setBusyId(row.id);
    try {
      await decideFn({ data: { refillId: row.id, decision, reason, environment: env } });
      toast.success(decision === "approved" ? "Approved & charged" : "Declined — hold released");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell title="Refill Requests" eyebrow="Pending provider review and approval">
      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={`px-3 py-1.5 text-xs uppercase tracking-[0.18em] border ${
              status === t.key
                ? "bg-ink text-primary-foreground border-ink"
                : "border-border bg-background hover:bg-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!rows ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No refill requests in this state.</p>
      ) : (
        <div className="border border-border bg-background overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Patient</th>
                <th className="text-left px-4 py-3">Medication</th>
                <th className="text-left px-4 py-3">Pharmacy</th>
                <th className="text-left px-4 py-3">Refill</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Requested</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3">
                    {r.patient_name}
                    {r.patient_note && (
                      <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                        “{r.patient_note}”
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{r.products?.name ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{r.products?.pharmacy ?? "—"}</td>
                  <td className="px-4 py-3">#{r.sequence}</td>
                  <td className="px-4 py-3">{formatMoney(r.amount_cents)}</td>
                  <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "pending" ? (
                      <div className="inline-flex gap-2">
                        <button
                          disabled={busyId === r.id}
                          onClick={() => decide(r, "approved")}
                          className="inline-flex items-center gap-1 border border-emerald-600 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve & charge
                        </button>
                        <button
                          disabled={busyId === r.id}
                          onClick={() => decide(r, "declined")}
                          className="inline-flex items-center gap-1 border border-destructive px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-destructive hover:bg-destructive/5 disabled:opacity-40"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Decline
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {r.status}
                        {r.reason ? ` — ${r.reason}` : ""}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
