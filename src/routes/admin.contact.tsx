import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mail, MailOpen, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/contact")({
  head: () => ({ meta: [{ title: "Contact Inquiries — Admin" }] }),
  component: AdminContactPage,
});

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  residency_state: string | null;
  message: string;
  status: "new" | "read";
  created_at: string;
};

type Filter = "all" | "new" | "read";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function AdminContactPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_inquiries")
      .select("id,name,email,phone,residency_state,message,status,created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) toast.error(error.message);
    setInquiries((data ?? []) as Inquiry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (id: string, status: "new" | "read") => {
    setUpdatingId(id);
    const { error } = await supabase.from("contact_inquiries").update({ status }).eq("id", id);
    setUpdatingId(null);
    if (error) return toast.error(error.message);
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const toggleOpen = (row: Inquiry) => {
    const next = openId === row.id ? null : row.id;
    setOpenId(next);
    if (next && row.status === "new") void setStatus(row.id, "read");
  };

  const newCount = useMemo(() => inquiries.filter((i) => i.status === "new").length, [inquiries]);
  const visible = useMemo(
    () => (filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter)),
    [inquiries, filter],
  );

  return (
    <AdminShell
      eyebrow="messages"
      title="Contact Inquiries"
      actions={
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-[0.18em] hover:bg-secondary"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["all", "new", "read"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs uppercase tracking-[0.18em] rounded-sm border ${
              filter === f
                ? "bg-ink text-primary-foreground border-ink"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f === "all" ? `All (${inquiries.length})` : f === "new" ? `New (${newCount})` : "Read"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading inquiries…
        </div>
      ) : visible.length === 0 ? (
        <div className="border border-border bg-background p-10 text-center text-sm text-muted-foreground">
          No contact inquiries {filter === "all" ? "yet" : `marked ${filter}`}.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((row) => {
            const open = openId === row.id;
            return (
              <div
                key={row.id}
                className={`border bg-background ${row.status === "new" ? "border-accent" : "border-border"}`}
              >
                <button
                  onClick={() => toggleOpen(row)}
                  className="w-full text-left px-4 sm:px-5 py-4 flex flex-wrap items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg truncate">{row.name}</span>
                      <span
                        className={`text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-sm ${
                          row.status === "new"
                            ? "bg-accent text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 break-all">
                      {row.email}
                      {row.phone ? ` · ${row.phone}` : ""}
                      {row.residency_state ? ` · ${row.residency_state}` : ""}
                    </div>
                    {!open && (
                      <p className="text-sm text-foreground/70 mt-2 line-clamp-2">{row.message}</p>
                    )}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground shrink-0">
                    {formatDate(row.created_at)}
                  </div>
                </button>

                {open && (
                  <div className="px-4 sm:px-5 pb-5 border-t border-border pt-4">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{row.message}</p>
                    <div className="flex flex-wrap gap-2 mt-5">
                      <a
                        href={`mailto:${row.email}`}
                        className="inline-flex items-center gap-2 bg-ink text-primary-foreground px-4 py-2 text-xs uppercase tracking-[0.18em] hover:bg-accent"
                      >
                        <Mail className="h-3.5 w-3.5" /> Reply by email
                      </a>
                      <button
                        onClick={() => void setStatus(row.id, row.status === "new" ? "read" : "new")}
                        disabled={updatingId === row.id}
                        className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-[0.18em] hover:bg-secondary disabled:opacity-50"
                      >
                        {updatingId === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <MailOpen className="h-3.5 w-3.5" />
                        )}
                        Mark as {row.status === "new" ? "read" : "unread"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
