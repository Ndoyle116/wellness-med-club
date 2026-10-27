import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderDetailDrawer } from "@/components/admin/OrderDetailDrawer";
import {
  adminListOrders,
  adminApproveOrder,
  adminRejectOrder,
  adminGetOrderItems,
} from "@/lib/admin-orders.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
  component: AdminOrdersPage,
});

const PHARMACY_LABEL: Record<string, string> = {
  olympia: "Olympia",
  rush: "Rush",
  empower: "Empower",
  strive: "Strive",
  other: "Other",
};

const STATUS_TONE: Record<string, string> = {
  approved: "bg-accent/10 text-accent border-accent/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  fulfilled: "bg-accent/10 text-accent border-accent/30",
  cancelled: "bg-secondary text-muted-foreground border-border",
  under_review: "bg-amber-100 text-amber-800 border-amber-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
};

type Order = {
  id: string;
  user_id: string;
  status: string;
  total_cents: number;
  paid_at: string | null;
  created_at: string;
  patient_name: string;
  pharmacies: string[];
};

type OrderItem = {
  id: string;
  quantity: number;
  unit_price_cents: number;
  product_name_snapshot: string;
  product_category_snapshot: string;
  pharmacy_snapshot: string | null;
};

type Filter = "all" | "pending" | "approved" | "rejected";

function AdminOrdersPage() {
  const list = useServerFn(adminListOrders);
  const approve = useServerFn(adminApproveOrder);
  const reject = useServerFn(adminRejectOrder);
  const getItems = useServerFn(adminGetOrderItems);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, OrderItem[] | "loading">>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  const refresh = async () => {
    const res = await list({ data: undefined as unknown as never });
    setOrders(res.orders as Order[]);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApprove = async (id: string) => {
    setBusy(id);
    try {
      await approve({ data: { orderId: id } });
      toast.success("Order approved — patient notified");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setBusy(null);
    }
  };

  const onReject = async (id: string) => {
    const reason = window.prompt("Reason for rejection (sent to patient):");
    if (!reason) return;
    setBusy(id);
    try {
      await reject({ data: { orderId: id, reason } });
      toast.success("Order rejected — patient notified");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setBusy(null);
    }
  };

  const toggleExpand = async (orderId: string) => {
    setExpanded((prev) => {
      if (prev[orderId]) {
        const next = { ...prev };
        delete next[orderId];
        return next;
      }
      return { ...prev, [orderId]: "loading" };
    });
    if (expanded[orderId]) return;
    try {
      const res = await getItems({ data: { orderId } });
      setExpanded((prev) => ({ ...prev, [orderId]: res.items as OrderItem[] }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load items");
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  const filtered = (orders ?? []).filter((o) => {
    if (filter === "pending" &&
      !["under_review", "awaiting_consultation", "awaiting_labs", "pending"].includes(o.status))
      return false;
    if (filter === "approved" && !["approved", "fulfilled", "prescription_sent"].includes(o.status))
      return false;
    if (filter === "rejected" && !["rejected", "cancelled"].includes(o.status)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !o.id.toLowerCase().includes(q) &&
        !(o.patient_name ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const counts = {
    all: (orders ?? []).length,
    pending: (orders ?? []).filter((o) =>
      ["under_review", "awaiting_consultation", "awaiting_labs", "pending"].includes(o.status),
    ).length,
    approved: (orders ?? []).filter((o) =>
      ["approved", "fulfilled", "prescription_sent"].includes(o.status),
    ).length,
    rejected: (orders ?? []).filter((o) => ["rejected", "cancelled"].includes(o.status)).length,
  };

  return (
    <AdminShell
      eyebrow="Orders"
      title="Order review queue"
      actions={
        <input
          type="search"
          placeholder="Search by ID or patient…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-sm w-64 focus:outline-none focus:border-accent"
        />
      }
    >
      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {(["all", "pending", "approved", "rejected"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 text-xs uppercase tracking-[0.18em] border-b-2 -mb-px transition-colors ${
              filter === f
                ? "border-ink text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {f} <span className="text-muted-foreground">({counts[f]})</span>
          </button>
        ))}
      </div>

      {!orders ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-background border border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No orders match this view.</p>
        </div>
      ) : (
        <div className="bg-background border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-[0.16em]">
              <tr>
                <th className="w-8 px-2 py-3"></th>
                <th className="text-left px-4 py-3 font-medium">Order</th>
                <th className="text-left px-4 py-3 font-medium">Patient</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Pharmacies</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const canReview = [
                  "under_review",
                  "awaiting_consultation",
                  "awaiting_labs",
                  "pending",
                ].includes(o.status);
                const rowExpanded = expanded[o.id];
                const tone = STATUS_TONE[o.status] ?? "bg-secondary text-foreground border-border";
                return (
                  <Fragment key={o.id}>
                    <tr className="border-t border-border hover:bg-secondary/30">
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={() => toggleExpand(o.id)}
                          className="text-muted-foreground hover:text-accent"
                          aria-label="Expand order items"
                        >
                          {rowExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDetailOrderId(o.id)}
                          className="font-medium underline-offset-2 hover:underline text-left"
                        >
                          #{o.id.slice(0, 8).toUpperCase()}
                        </button>
                        <div className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">{o.patient_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${tone}`}
                        >
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {o.pharmacies.length ? (
                          <div className="flex flex-wrap gap-1">
                            {o.pharmacies.map((p) => (
                              <span
                                key={p}
                                className="border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]"
                              >
                                {PHARMACY_LABEL[p] ?? p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-serif">
                        ${(o.total_cents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setDetailOrderId(o.id)}
                            className="inline-flex items-center gap-1 border border-border px-3 py-1.5 text-xs uppercase tracking-[0.18em] hover:border-accent hover:text-accent"
                          >
                            Review
                          </button>
                          {canReview && (
                            <>
                              <button
                                onClick={() => onApprove(o.id)}
                                disabled={busy === o.id}
                                className="inline-flex items-center gap-1 bg-ink text-primary-foreground px-3 py-1.5 text-xs uppercase tracking-[0.18em] hover:bg-accent disabled:opacity-50"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => onReject(o.id)}
                                disabled={busy === o.id}
                                className="inline-flex items-center gap-1 border border-border px-3 py-1.5 text-xs uppercase tracking-[0.18em] hover:border-destructive hover:text-destructive disabled:opacity-50"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {rowExpanded && (
                      <tr className="bg-secondary/30 border-t border-border">
                        <td></td>
                        <td colSpan={6} className="px-4 py-4">
                          {rowExpanded === "loading" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <ItemsByPharmacy items={rowExpanded} />
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <OrderDetailDrawer
        orderId={detailOrderId}
        open={detailOrderId !== null}
        onOpenChange={(o) => !o && setDetailOrderId(null)}
        onChanged={refresh}
      />
    </AdminShell>
  );
}


function ItemsByPharmacy({ items }: { items: OrderItem[] }) {
  const groups = new Map<string, OrderItem[]>();
  for (const it of items) {
    const key = it.pharmacy_snapshot ?? "unassigned";
    const arr = groups.get(key) ?? [];
    arr.push(it);
    groups.set(key, arr);
  }
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">No items on this order.</p>;
  }
  return (
    <div className="space-y-3">
      {Array.from(groups.entries()).map(([key, groupItems]) => (
        <div key={key}>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
            {key === "unassigned"
              ? "No pharmacy assigned"
              : `${PHARMACY_LABEL[key] ?? key} — ${groupItems.length} item${
                  groupItems.length === 1 ? "" : "s"
                }`}
          </div>
          <ul className="text-sm">
            {groupItems.map((it) => (
              <li
                key={it.id}
                className="flex justify-between border-t border-border/60 py-1.5"
              >
                <span>
                  {it.product_name_snapshot}
                  <span className="text-muted-foreground"> × {it.quantity}</span>
                </span>
                <span className="font-serif">
                  ${((it.unit_price_cents * it.quantity) / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
