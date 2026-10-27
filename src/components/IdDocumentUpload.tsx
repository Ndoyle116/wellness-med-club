import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IdCard, Upload, Loader2, CheckCircle2 } from "lucide-react";

const MAX_SIZE = 15 * 1024 * 1024;
const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.webp,.heic";

/**
 * Government-issued ID upload (driver's license, state ID, or passport).
 * Required once, before a patient's first purchase. The file is stored in the
 * private `patient-documents` bucket and recorded in `patient_documents`, so it
 * shows up both in the patient portal and in the admin panel.
 */
export function IdDocumentUpload({
  userId,
  onUploaded,
  compact,
}: {
  userId: string;
  onUploaded?: (docId: string) => void;
  compact?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
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
      const path = `${userId}/id_license/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("patient-documents")
        .upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data: row, error: insErr } = await supabase
        .from("patient_documents")
        .insert({
          user_id: userId,
          doc_type: "id_license",
          file_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      setDone(file.name);
      toast.success("ID uploaded — saved to your patient portal");
      onUploaded?.(row.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={compact ? "" : "border border-border p-6"}>
      {!compact && (
        <div className="flex items-start gap-3 mb-4">
          <IdCard className="h-5 w-5 text-accent mt-0.5" />
          <div>
            <h3 className="font-serif text-lg">Government-issued ID</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              Upload one of the following: driver&apos;s license, state ID, or passport.
              Required before your first order and kept on file for the pharmacy.
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {done ? (
        <div className="flex items-center gap-2 text-sm text-accent">
          <CheckCircle2 className="h-4 w-4" /> {done} uploaded
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.18em] font-semibold bg-ink text-primary-foreground hover:bg-accent transition-colors disabled:opacity-40"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading…" : "Upload license, state ID or passport"}
        </button>
      )}
      <p className="text-[11px] text-muted-foreground mt-3">
        PDF or image, up to 15 MB. Stored privately and visible only to you and your provider.
      </p>
    </div>
  );
}
