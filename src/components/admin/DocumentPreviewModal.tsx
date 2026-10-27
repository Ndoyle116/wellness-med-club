import { X, ExternalLink, Download } from "lucide-react";
import { useEffect } from "react";

export type PreviewDoc = {
  id: string;
  file_name: string;
  signed_url: string | null;
  mime_type?: string | null;
};

export function DocumentPreviewModal({
  doc,
  onClose,
}: {
  doc: PreviewDoc | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, onClose]);

  if (!doc) return null;

  const url = doc.signed_url ?? "";
  const name = doc.file_name.toLowerCase();
  const mime = (doc.mime_type ?? "").toLowerCase();
  const isImage =
    mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|heic)$/i.test(name);
  const isPdf = mime === "application/pdf" || name.endsWith(".pdf");

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background w-full max-w-5xl h-[90vh] flex flex-col border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Document preview
            </div>
            <div className="font-medium text-sm truncate">{doc.file_name}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {url && (
              <>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 hover:bg-secondary rounded"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  href={url}
                  download={doc.file_name}
                  className="p-2 hover:bg-secondary rounded"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="flex-1 bg-secondary/30 overflow-auto">
          {!url ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Preview unavailable.
            </div>
          ) : isImage ? (
            <div className="h-full flex items-center justify-center p-4">
              <img
                src={url}
                alt={doc.file_name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={url}
              title={doc.file_name}
              className="w-full h-full bg-background"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground p-6 text-center">
              <p>Preview is not supported for this file type.</p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] font-semibold border border-foreground hover:bg-foreground hover:text-background"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
