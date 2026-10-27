import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CheckCircle2, Clock, XCircle, Upload, FileText, RotateCw } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  listMyApprovals,
  attachDocumentsToApproval,
} from "@/lib/approvals.functions";
import { useRequireAuth, PortalLoading, PortalError } from "@/lib/use-require-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/account_/approvals")({
  head: () => ({ meta: [{ title: "Lab Approvals — Wellness Med Club" }] }),
  component: MyApprovalsPage,
});

const MAX_SIZE = 15 * 1024 * 1024;

function MyApprovalsPage() {
  const listFn = useServerFn(listMyApprovals);
  const attachFn = useServerFn(attachDocumentsToApproval);
  const { user, ready } = useRequireAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const reload = () => {
    setLoadError(false);
    return listFn()
      .then((r) => setRows(r.approvals))
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    if (ready) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const onUpload = async (approvalId: string, files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    const file = files[0];
    if (file.size > MAX_SIZE) {
      toast.error("File must be under 15 MB");
      return;
    }
    setBusyId(approvalId);
    try {
      const safeName = file.name.replace(/[^\w.\-]/g, "_");
      const path = `${user.id}/lab_result/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("patient-documents")
        .upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (upErr) throw upErr;
      const { data: docRow, error: insErr } = await supabase
        .from("patient_documents")
        .insert({
          user_id: user.id,
          doc_type: "lab_result",
          file_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
        })
        .select("id")
        .single();
      if (insErr || !docRow) throw insErr ?? new Error("Upload failed");
      await attachFn({ data: { approvalId, documentIds: [docRow.id] } });
      toast.success("Updated labs submitted for review.");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusyId(null);
      const el = inputs.current[approvalId];
      if (el) el.value = "";
    }
  };

  if (!ready) {
    return (
      <SiteLayout>
        <PortalLoading />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
          My account
        </div>
        <h1 className="font-serif text-4xl mb-6">Lab Approvals</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Track your requests for lab-required medications. Approvals cover a
          single order — you'll need a fresh request for repeat purchases.
        </p>

        {loadError ? (
          <PortalError
            message="We couldn't load your lab approvals right now."
            onRetry={reload}
          />
        ) : !rows ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven't requested any lab reviews yet.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((a) => (
              <div key={a.id} className="border border-border p-4 bg-background">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to="/products/$slug"
                        params={{ slug: a.products?.slug ?? "" }}
                        className="font-medium hover:underline"
                      >
                        {a.products?.name ?? "—"}
                      </Link>
                      {a.resubmitted_at && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] font-semibold px-1.5 py-0.5 bg-accent/15 text-accent rounded-full">
                          <RotateCw className="h-3 w-3" /> Resubmitted
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Requested {new Date(a.created_at).toLocaleDateString()}
                      {a.reviewed_at && (
                        <> · Reviewed {new Date(a.reviewed_at).toLocaleDateString()}</>
                      )}
                    </div>
                    {a.documents?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {a.documents.map((d: any) => (
                          <span
                            key={d.id}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 border border-border bg-secondary/40 max-w-[220px]"
                            title={d.file_name}
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate">{d.file_name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {a.reason && (
                      <p className="text-xs mt-2 text-destructive">
                        <strong>Clinician's note:</strong> {a.reason}
                      </p>
                    )}
                    {a.status === "approved" && a.products?.slug && (
                      <div className="mt-3">
                        <Link
                          to="/products/$slug"
                          params={{ slug: a.products.slug }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-[0.16em] font-semibold bg-foreground text-background hover:bg-accent transition-colors"
                        >
                          Continue to purchase
                        </Link>
                      </div>
                    )}
                    {a.status === "disapproved" && (
                      <div className="mt-3">
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-[0.16em] font-semibold border border-foreground hover:bg-foreground hover:text-background transition-colors cursor-pointer disabled:opacity-50">
                          <input
                            ref={(el) => {
                              inputs.current[a.id] = el;
                            }}
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
                            className="hidden"
                            disabled={busyId === a.id}
                            onChange={(e) => onUpload(a.id, e.target.files)}
                          />
                          {busyId === a.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          Upload updated labs
                        </label>
                      </div>
                    )}
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: any; cls: string; label: string }> = {
    pending: { icon: Clock, cls: "bg-amber-500/15 text-amber-700", label: "Pending" },
    approved: {
      icon: CheckCircle2,
      cls: "bg-emerald-500/15 text-emerald-700",
      label: "Approved",
    },
    disapproved: {
      icon: XCircle,
      cls: "bg-destructive/15 text-destructive",
      label: "Disapproved",
    },
    consumed: {
      icon: CheckCircle2,
      cls: "bg-secondary text-muted-foreground",
      label: "Used",
    },
  };
  const s = map[status] ?? map.pending;
  const Icon = s.icon;
  return (
    <span
      className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-full font-semibold ${s.cls}`}
    >
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
}
