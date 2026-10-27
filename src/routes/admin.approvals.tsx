import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CheckCircle2, XCircle, RotateCw, FileText } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminListApprovals, adminDecideApproval } from "@/lib/approvals.functions";
import { CustomerDetailDrawer } from "@/components/admin/CustomerDetailDrawer";
import {
  DocumentPreviewModal,
  type PreviewDoc,
} from "@/components/admin/DocumentPreviewModal";
import { toast } from "sonner";

type AttachedDoc = {
  id: string;
  file_name: string;
  signed_url: string | null;
  mime_type?: string | null;
  created_at: string;
};

type Row = {
  id: string;
  user_id: string;
  status: string;
  patient_name: string;
  patient_email: string | null;
  patient_note: string | null;
  requested_via: string;
  reason: string | null;
  previous_reason: string | null;
  resubmitted_at: string | null;
  documents: AttachedDoc[];
  created_at: string;
  reviewed_at: string | null;
  products: { name: string; slug: string } | null;
};

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "disapproved", label: "Disapproved" },
  { key: "consumed", label: "Consumed" },
  { key: "all", label: "All" },
] as const;

export const Route = createFileRoute("/admin/approvals")({
  head: () => ({ meta: [{ title: "Lab Approvals — Admin" }] }),
  component: AdminApprovalsPage,
});

function AdminApprovalsPage() {
  const listFn = useServerFn(adminListApprovals);
  const decideFn = useServerFn(adminDecideApproval);
  const [status, setStatus] = useState<(typeof TABS)[number]["key"]>("pending");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PreviewDoc | null>(null);

  const reload = () =>
    listFn({ data: { status } }).then((r) => setRows(r.approvals as Row[]));

  useEffect(() => {
    setRows(null);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const decide = async (row: Row, decision: "approved" | "disapproved") => {
    let reason: string | undefined;
    if (decision === "disapproved") {
      reason = window.prompt("Reason for disapproval (visible to patient):") ?? "";
      if (!reason.trim()) return;
    }
    setBusyId(row.id);
    try {
      await decideFn({ data: { approvalId: row.id, decision, reason } });
      toast.success(decision === "approved" ? "Approved" : "Disapproved");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell title="Lab Approvals" eyebrow="Clinical review queue">
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
        <p className="text-sm text-muted-foreground">No approvals in this state.</p>
      ) : (
        <div className="border border-border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Patient</th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">Requested</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setOpenUserId(r.user_id)}
                      className="text-left hover:underline"
                    >
                      <div className="font-medium">{r.patient_name}</div>
                      <div className="text-xs text-muted-foreground">{r.patient_email}</div>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{r.products?.name ?? "—"}</span>
                      {r.resubmitted_at && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] font-semibold px-1.5 py-0.5 bg-accent/15 text-accent rounded-full">
                          <RotateCw className="h-3 w-3" /> Resubmitted
                        </span>
                      )}
                    </div>
                    {r.documents.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {r.documents.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setPreviewDoc(d)}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 border border-border bg-secondary/40 hover:bg-secondary max-w-[220px]"
                            title={d.file_name}
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate">{d.file_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {r.patient_note && (
                      <p className="text-[11px] italic text-muted-foreground mt-1">
                        "{r.patient_note}"
                      </p>
                    )}
                    {r.previous_reason && (
                      <p className="text-[11px] text-destructive/80 mt-1">
                        <span className="font-semibold uppercase tracking-widest">
                          Prior note:
                        </span>{" "}
                        {r.previous_reason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.requested_via === "uploaded_labs" ? "Uploaded labs" : "Purchasing labs"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                    {r.resubmitted_at && (
                      <div className="text-[10px] mt-0.5">
                        Resub {new Date(r.resubmitted_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={busyId === r.id}
                          onClick={() => decide(r, "approved")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          disabled={busyId === r.id}
                          onClick={() => decide(r, "disapproved")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] font-semibold bg-destructive text-white hover:opacity-90 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Disapprove
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-xs text-muted-foreground uppercase tracking-widest">
                        {r.status}
                        {r.reason && (
                          <div className="text-[10px] mt-1 normal-case">"{r.reason}"</div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openUserId && (
        <CustomerDetailDrawer
          userId={openUserId}
          onClose={() => setOpenUserId(null)}
          onChanged={reload}
        />
      )}

      <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </AdminShell>
  );
}
