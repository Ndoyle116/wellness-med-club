import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  adminGetOrderDetail,
  adminApproveOrder,
  adminRejectOrder,
} from "@/lib/admin-orders.functions";
import { toast } from "sonner";

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

type Detail = Awaited<ReturnType<typeof adminGetOrderDetail>>;

export function OrderDetailDrawer({
  orderId,
  open,
  onOpenChange,
  onChanged,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onChanged?: () => void;
}) {
  const getDetail = useServerFn(adminGetOrderDetail);
  const approve = useServerFn(adminApproveOrder);
  const reject = useServerFn(adminRejectOrder);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !orderId) return;
    setDetail(null);
    setNotes("");
    setLoading(true);
    getDetail({ data: { orderId } })
      .then((res) => setDetail(res as Detail))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load order"))
      .finally(() => setLoading(false));
  }, [open, orderId, getDetail]);

  const canReview =
    detail &&
    ["under_review", "awaiting_consultation", "awaiting_labs", "pending"].includes(
      detail.order.status,
    );

  const onApprove = async () => {
    if (!orderId) return;
    setBusy(true);
    try {
      await approve({ data: { orderId, notes: notes || undefined } });
      toast.success("Order approved — patient notified");
      onChanged?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    if (!orderId) return;
    const reason = notes || window.prompt("Reason for rejection (sent to patient):") || "";
    if (reason.trim().length < 3) {
      toast.error("Rejection reason is required (min 3 chars).");
      return;
    }
    setBusy(true);
    try {
      await reject({ data: { orderId, reason } });
      toast.success("Order rejected — patient notified");
      onChanged?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {loading || !detail ? (
          <div className="grid place-items-center h-full py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col min-h-full">
            <SheetHeader className="px-6 py-5 border-b border-border">
              <SheetTitle className="font-serif text-2xl">
                Order #{detail.order.id.slice(0, 8).toUpperCase()}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                    STATUS_TONE[detail.order.status] ?? "bg-secondary text-foreground border-border"
                  }`}
                >
                  {detail.order.status.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  Placed {new Date(detail.order.created_at).toLocaleString()}
                </span>
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 px-6 py-5 space-y-6">
              {/* Patient */}
              <Section title="Patient">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Field
                    label="Name"
                    value={
                      [detail.profile?.first_name, detail.profile?.last_name]
                        .filter(Boolean)
                        .join(" ") || "—"
                    }
                  />
                  <Field label="Email" value={detail.email ?? "—"} />
                  <Field label="Phone" value={detail.profile?.phone ?? "—"} />
                  <Field
                    label="Date of birth"
                    value={
                      detail.profile?.date_of_birth
                        ? new Date(detail.profile.date_of_birth).toLocaleDateString()
                        : "—"
                    }
                  />
                </dl>
              </Section>

              {/* Intake */}
              <Section title="Medical intake">
                {detail.intake ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <Field label="Residency" value={detail.intake.residency_state} />
                      <Field
                        label="Attestation"
                        value={
                          detail.intake.attestation_signed
                            ? `Signed ${
                                detail.intake.attestation_signed_at
                                  ? new Date(
                                      detail.intake.attestation_signed_at,
                                    ).toLocaleDateString()
                                  : ""
                              }`
                            : "Not signed"
                        }
                      />
                    </div>
                    <FlagRow
                      flags={[
                        ["Cancer history", detail.intake.has_cancer_history],
                        ["Cardiac condition", detail.intake.has_cardiac_condition],
                        ["Endocrine condition", detail.intake.has_endocrine_condition],
                        ["Pregnant / nursing", detail.intake.is_pregnant_or_nursing],
                      ]}
                    />
                    <TextField label="Allergies" value={detail.intake.allergies} />
                    <TextField
                      label="Current medications"
                      value={detail.intake.current_medications}
                    />
                    <TextField label="Medical history" value={detail.intake.medical_history} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No intake submitted.</p>
                )}
              </Section>

              {/* Patient uploads (labs + ID) */}
              <Section title="Patient uploads">
                {detail.documents && detail.documents.length > 0 ? (
                  <ul className="divide-y divide-border border border-border">
                    {detail.documents.map((d) => {
                      const label =
                        d.doc_type === "lab_result"
                          ? "Lab result"
                          : d.doc_type === "id_license"
                            ? "ID / License"
                            : "Other";
                      return (
                        <li key={d.id} className="flex items-center gap-3 p-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              {label}
                            </div>
                            <div className="text-sm truncate">{d.file_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(d.created_at).toLocaleDateString()}
                              {d.size_bytes
                                ? ` · ${Math.round(d.size_bytes / 1024)} KB`
                                : ""}
                            </div>
                          </div>
                          {d.signed_url ? (
                            <a
                              href={d.signed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs uppercase tracking-[0.2em] border border-border px-3 py-1.5 hover:border-accent hover:text-accent"
                            >
                              Open
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Link expired
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No documents uploaded.
                  </p>
                )}
              </Section>

              {/* Items grouped by pharmacy */}
              <Section title="Items & pharmacies">
                <ItemsByPharmacy items={detail.items} />
                <div className="mt-4 border-t border-border pt-3 space-y-1 text-sm">
                  <Row label="Subtotal" value={`$${(detail.order.subtotal_cents / 100).toFixed(2)}`} />
                  <Row
                    label="Total"
                    value={`$${(detail.order.total_cents / 100).toFixed(2)}`}
                    strong
                  />
                  {detail.order.paid_at && (
                    <Row
                      label="Paid"
                      value={new Date(detail.order.paid_at).toLocaleString()}
                    />
                  )}
                </div>
              </Section>

              {/* Requirements */}
              {(detail.order.requires_labs || detail.order.requires_consultation) && (
                <Section title="Requirements">
                  <ul className="text-sm space-y-1">
                    {detail.order.requires_labs && (
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        Labs required
                        {detail.order.has_recent_labs && (
                          <span className="text-muted-foreground">
                            (recent labs on file)
                          </span>
                        )}
                      </li>
                    )}
                    {detail.order.requires_consultation && (
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        Consultation required
                      </li>
                    )}
                  </ul>
                </Section>
              )}

              {/* Status history */}
              <Section title="Status history">
                {detail.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events yet.</p>
                ) : (
                  <ol className="space-y-2 text-sm">
                    {detail.events.map((ev) => (
                      <li
                        key={ev.id}
                        className="border-l-2 border-border pl-3 py-1"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-medium">
                            {ev.event_type.replace(/[._]/g, " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ev.created_at).toLocaleString()}
                          </span>
                        </div>
                        {(ev.from_status || ev.to_status) && (
                          <div className="text-xs text-muted-foreground">
                            {ev.from_status ?? "—"} → {ev.to_status ?? "—"}
                          </div>
                        )}
                        {ev.notes && (
                          <div className="text-xs mt-1 whitespace-pre-wrap">{ev.notes}</div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </Section>

              {(detail.order.provider_notes || detail.order.rejected_reason) && (
                <Section title="Provider notes">
                  {detail.order.provider_notes && (
                    <p className="text-sm whitespace-pre-wrap">
                      {detail.order.provider_notes}
                    </p>
                  )}
                  {detail.order.rejected_reason && (
                    <p className="text-sm text-destructive whitespace-pre-wrap mt-2">
                      Rejection: {detail.order.rejected_reason}
                    </p>
                  )}
                </Section>
              )}
            </div>

            {/* Action bar */}
            {canReview && (
              <div className="border-t border-border bg-secondary/30 px-6 py-4 sticky bottom-0">
                <label className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  Notes / rejection reason
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent mb-3"
                  placeholder="Optional for approval, required for rejection…"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={onReject}
                    disabled={busy}
                    className="inline-flex items-center gap-1 border border-border px-4 py-2 text-xs uppercase tracking-[0.18em] hover:border-destructive hover:text-destructive disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                  <button
                    onClick={onApprove}
                    disabled={busy}
                    className="inline-flex items-center gap-1 bg-ink text-primary-foreground px-4 py-2 text-xs uppercase tracking-[0.18em] hover:bg-accent disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
        {title}
      </h3>
      <div className="bg-background border border-border p-4">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function TextField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-0.5">
        {label}
      </div>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function FlagRow({ flags }: { flags: Array<[string, boolean | null]> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {flags.map(([label, val]) => (
        <span
          key={label}
          className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
            val
              ? "bg-destructive/10 text-destructive border-destructive/30"
              : "bg-secondary text-muted-foreground border-border"
          }`}
        >
          {label}: {val ? "Yes" : "No"}
        </span>
      ))}
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between ${strong ? "font-serif text-base" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ItemsByPharmacy({
  items,
}: {
  items: Array<{
    id: string;
    quantity: number;
    unit_price_cents: number;
    product_name_snapshot: string;
    pharmacy_snapshot: string | null;
    add_ons?: unknown;
  }>;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No items on this order.</p>;
  }
  const groups = new Map<string, typeof items>();
  for (const it of items) {
    const key = it.pharmacy_snapshot ?? "unassigned";
    const arr = groups.get(key) ?? [];
    arr.push(it);
    groups.set(key, arr);
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
          <ul className="text-sm divide-y divide-border/60">
            {groupItems.map((it) => {
              const addOns = (it.add_ons ?? {}) as {
                supplies?: { price_cents: number };
                televisit?: { price_cents: number };
              };
              const addOnCents =
                (addOns.supplies?.price_cents ?? 0) + (addOns.televisit?.price_cents ?? 0);
              const lineCents = (it.unit_price_cents + addOnCents) * it.quantity;
              return (
                <li key={it.id} className="py-1.5">
                  <div className="flex justify-between">
                    <span>
                      {it.product_name_snapshot}
                      <span className="text-muted-foreground"> × {it.quantity}</span>
                    </span>
                    <span className="font-serif">${(lineCents / 100).toFixed(2)}</span>
                  </div>
                  {(addOns.supplies || addOns.televisit) && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {addOns.supplies &&
                        `+ Supplies kit ($${(addOns.supplies.price_cents / 100).toFixed(2)})`}
                      {addOns.supplies && addOns.televisit && " · "}
                      {addOns.televisit &&
                        `+ Tele-visit ($${(addOns.televisit.price_cents / 100).toFixed(2)})`}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
