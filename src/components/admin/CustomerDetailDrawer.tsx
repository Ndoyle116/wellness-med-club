import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Send,
  ShoppingBag,
  RotateCw,
} from "lucide-react";
import { adminGetCustomer, adminDecideApproval } from "@/lib/approvals.functions";
import { adminListThread, adminSendMessage } from "@/lib/messages.functions";
import { toast } from "sonner";
import { DocumentPreviewModal, type PreviewDoc } from "@/components/admin/DocumentPreviewModal";

type CustomerDetail = Awaited<ReturnType<typeof adminGetCustomer>>;
type Message = {
  id: string;
  sender_id: string;
  sender_role: "patient" | "staff";
  body: string;
  read_at: string | null;
  created_at: string;
};

export function CustomerDetailDrawer({
  userId,
  onClose,
  onChanged,
}: {
  userId: string;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const getFn = useServerFn(adminGetCustomer);
  const decideFn = useServerFn(adminDecideApproval);
  const threadFn = useServerFn(adminListThread);
  const sendFn = useServerFn(adminSendMessage);

  const [data, setData] = useState<CustomerDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<"approvals" | "messages" | "documents" | "orders">(
    "approvals",
  );
  const [previewDoc, setPreviewDoc] = useState<PreviewDoc | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    getFn({ data: { userId } }).then(setData);
    threadFn({ data: { userId } }).then((r) => setMessages(r.messages as Message[]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, tab]);

  const decide = async (approvalId: string, decision: "approved" | "disapproved") => {
    let reason: string | undefined;
    if (decision === "disapproved") {
      reason = window.prompt("Reason for disapproval (visible to patient):") ?? "";
      if (!reason.trim()) return;
    }
    setBusyId(approvalId);
    try {
      await decideFn({ data: { approvalId, decision, reason } });
      toast.success(decision === "approved" ? "Approved" : "Disapproved");
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const send = async () => {
    const body = msgBody.trim();
    if (!body) return;
    setSending(true);
    try {
      await sendFn({ data: { userId, body } });
      setMsgBody("");
      threadFn({ data: { userId } }).then((r) => setMessages(r.messages as Message[]));
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="w-full max-w-2xl bg-background h-full overflow-y-auto border-l border-border shadow-xl flex flex-col">
        <header className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Patient profile
            </div>
            <h2 className="font-serif text-2xl">
              {data
                ? [data.profile?.first_name, data.profile?.last_name]
                    .filter(Boolean)
                    .join(" ") || data.email || "Patient"
                : "Loading…"}
            </h2>
            {data?.email && (
              <div className="text-xs text-muted-foreground mt-1">{data.email}</div>
            )}
          </div>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="px-6 border-b border-border bg-secondary/30 flex gap-1">
          {(["approvals", "messages", "documents", "orders"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs uppercase tracking-[0.18em] border-b-2 -mb-px ${
                tab === t
                  ? "border-accent text-foreground font-semibold"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6">
          {!data ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : tab === "approvals" ? (
            <div className="space-y-3">
              {data.approvals.length === 0 && (
                <p className="text-sm text-muted-foreground">No approvals yet.</p>
              )}
              {data.approvals.map((a: any) => (
                <div key={a.id} className="border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2 flex-wrap">
                        {a.products?.name ?? "—"}
                        {a.resubmitted_at && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] font-semibold px-1.5 py-0.5 bg-accent/15 text-accent rounded-full">
                            <RotateCw className="h-3 w-3" /> Resubmitted
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {a.requested_via === "uploaded_labs"
                          ? "Uploaded existing labs"
                          : "Purchasing lab panel"}
                        {" · "}
                        {new Date(a.created_at).toLocaleDateString()}
                        {a.resubmitted_at && (
                          <> · Resub {new Date(a.resubmitted_at).toLocaleDateString()}</>
                        )}
                      </div>
                      {a.documents?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {a.documents.map((d: any) => (
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
                      {a.patient_note && (
                        <p className="text-xs mt-2 italic">"{a.patient_note}"</p>
                      )}
                      {a.previous_reason && (
                        <p className="text-xs mt-2 text-destructive/80">
                          <span className="font-semibold uppercase tracking-widest text-[10px]">
                            Prior note:
                          </span>{" "}
                          {a.previous_reason}
                        </p>
                      )}
                      {a.reason && (
                        <p className="text-xs mt-2 text-destructive">Note: {a.reason}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-full font-semibold ${
                        a.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-700"
                          : a.status === "pending"
                            ? "bg-amber-500/15 text-amber-700"
                            : a.status === "disapproved"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                  {a.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        disabled={busyId === a.id}
                        onClick={() => decide(a.id, "approved")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] font-semibold bg-emerald-600 text-white disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        disabled={busyId === a.id}
                        onClick={() => decide(a.id, "disapproved")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] font-semibold bg-destructive text-white disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Disapprove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : tab === "documents" ? (
            <div className="space-y-2">
              {data.documents.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No documents uploaded yet.
                </p>
              )}
              {data.documents.map((d: any) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setPreviewDoc(d)}
                  className="w-full text-left flex items-center gap-3 border border-border p-3 hover:bg-secondary/40"
                >
                  <FileText className="h-4 w-4 text-accent" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{d.file_name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                      {d.doc_type} · {new Date(d.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : tab === "orders" ? (
            <div className="space-y-2">
              {data.orders.length === 0 && (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              )}
              {data.orders.map((o: any) => (
                <div key={o.id} className="border border-border p-3 flex items-center gap-3">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      ${(o.total_cents / 100).toFixed(2)}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {o.status} · {new Date(o.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col h-[60vh]">
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No messages yet. Start the conversation below.
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender_role === "staff" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 text-sm ${
                        m.sender_role === "staff"
                          ? "bg-ink text-primary-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.body}</div>
                      <div className="text-[10px] opacity-70 mt-1">
                        {new Date(m.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="mt-3 flex gap-2">
                <textarea
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  placeholder="Reply to patient…"
                  rows={2}
                  className="flex-1 border border-border p-2 text-sm resize-none"
                />
                <button
                  onClick={send}
                  disabled={sending || !msgBody.trim()}
                  className="px-4 bg-ink text-primary-foreground text-xs uppercase tracking-[0.18em] font-semibold disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
      <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
}
