import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  FileText,
  IdCard,
  Trash2,
  Download,
  ChevronLeft,
} from "lucide-react";

export const Route = createFileRoute("/account_/documents")({
  validateSearch: (search: Record<string, unknown>) => ({
    product: typeof search.product === "string" ? search.product : undefined,
  }),
  head: () => ({
    meta: [{ title: "My Documents — Wellness Med Club" }],
  }),
  component: DocumentsPage,
});

type DocType = "lab_result" | "id_license";

type DocRow = {
  id: string;
  doc_type: DocType | "other";
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.webp,.heic";

function DocumentsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { product } = Route.useSearch();
  const [docs, setDocs] = useState<DocRow[] | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const refresh = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("patient_documents")
      .select("id, doc_type, file_path, file_name, mime_type, size_bytes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setDocs((data ?? []) as DocRow[]);
  };

  useEffect(() => {
    if (user) void refresh();
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

  const labs = (docs ?? []).filter((d) => d.doc_type === "lab_result");
  const ids = (docs ?? []).filter((d) => d.doc_type === "id_license");

  return (
    <SiteLayout>
      <PageHero
        eyebrow="patient portal"
        title="My Documents"
        subtitle="Upload lab results and a government-issued ID. Files are private and only visible to you and your provider."
      />
      <section className="mx-auto max-w-4xl px-6 pb-4">
        <Link
          to="/account"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to account
        </Link>
      </section>
      <section className="mx-auto max-w-4xl px-6 pb-20 space-y-10">
        <UploadCard
          userId={user.id}
          docType="lab_result"
          title="Lab Results"
          desc="Upload recent bloodwork (PDF or image). Your provider will review before your appointment."
          icon={FileText}
          docs={labs}
          onChange={refresh}
        />
        <UploadCard
          userId={user.id}
          docType="id_license"
          title="License, State ID or Passport"
          desc="Required before your first order and by the pharmacy for controlled substances. Upload a clear photo of your driver's license, state ID, or passport."
          icon={IdCard}
          docs={ids}
          onChange={refresh}
        />

        {product && (
          <div className="border border-border bg-secondary/30 p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {labs.length > 0
                ? "Your lab results are uploaded. Submit them to your provider and return to your product."
                : "Upload at least one lab result above to submit it for review."}
            </p>
            <button
              type="button"
              disabled={labs.length === 0}
              onClick={() => {
                toast.success("Labs submitted — Nicole will review and approve.");
                navigate({ to: "/products/$slug", params: { slug: product } });
              }}
              className="shrink-0 px-5 py-2.5 text-xs uppercase tracking-[0.18em] font-semibold bg-ink text-primary-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              Submit &amp; return to product
            </button>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function UploadCard({
  userId,
  docType,
  title,
  desc,
  icon: Icon,
  docs,
  onChange,
}: {
  userId: string;
  docType: DocType;
  title: string;
  desc: string;
  icon: typeof FileText;
  docs: DocRow[];
  onChange: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > MAX_SIZE) {
      toast.error("File must be under 15 MB");
      return;
    }
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]/g, "_");
      const path = `${userId}/${docType}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("patient-documents")
        .upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("patient_documents").insert({
        user_id: userId,
        doc_type: docType,
        file_path: path,
        file_name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
      });
      if (insErr) throw insErr;

      toast.success("Uploaded");
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDownload = async (doc: DocRow) => {
    const { data, error } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(doc.file_path, 60);
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const handleDelete = async (doc: DocRow) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    const { error: sErr } = await supabase.storage
      .from("patient-documents")
      .remove([doc.file_path]);
    if (sErr) {
      toast.error(sErr.message);
      return;
    }
    const { error: dErr } = await supabase
      .from("patient_documents")
      .delete()
      .eq("id", doc.id);
    if (dErr) toast.error(dErr.message);
    else {
      toast.success("Deleted");
      onChange();
    }
  };

  return (
    <div className="border border-border bg-background">
      <div className="p-6 border-b border-border flex items-start gap-4">
        <Icon className="h-6 w-6 text-accent shrink-0 mt-1" />
        <div className="flex-1">
          <h2 className="font-serif text-xl">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>

      <label
        className={`block m-6 border border-dashed border-border p-8 text-center cursor-pointer transition-colors ${
          uploading ? "opacity-60" : "hover:border-accent hover:bg-accent/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        ) : (
          <>
            <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <div className="text-sm font-medium">Click to upload</div>
            <div className="text-xs text-muted-foreground mt-1">
              PDF, PNG, JPG, WEBP · up to 15 MB
            </div>
          </>
        )}
      </label>

      {docs.length > 0 && (
        <ul className="border-t border-border divide-y divide-border">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-6 py-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{d.file_name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleDateString()} ·{" "}
                  {d.size_bytes ? `${Math.round(d.size_bytes / 1024)} KB` : ""}
                </div>
              </div>
              <button
                onClick={() => handleDownload(d)}
                className="text-xs text-muted-foreground hover:text-foreground p-1.5"
                title="Open"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(d)}
                className="text-xs text-muted-foreground hover:text-destructive p-1.5"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
