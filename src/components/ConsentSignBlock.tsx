import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

export type SignableConsent = {
  id: string;
  slug: string;
  title: string;
  body: string;
  version: number;
  scope: "always_required" | "per_product";
  signed: boolean;
};

/**
 * Shared "read + acknowledge + e-sign" block.
 *
 * Used by the consents portal page and by the inline lab-panel purchase flow so
 * the wording and the legal capture (typed name, user agent, template version)
 * are identical everywhere a patient signs.
 */
export function ConsentSignBlock({
  consents,
  userId,
  compact = false,
  onSigned,
}: {
  consents: SignableConsent[];
  userId: string;
  compact?: boolean;
  onSigned?: (slugs: string[]) => void;
}) {
  const [acked, setAcked] = useState<Record<string, boolean>>({});
  const [signerName, setSignerName] = useState("");
  const [signing, setSigning] = useState(false);
  const [justSigned, setJustSigned] = useState<Set<string>>(new Set());

  const unsigned = useMemo(
    () => consents.filter((c) => !c.signed && !justSigned.has(c.slug)),
    [consents, justSigned],
  );
  const onFile = consents.filter((c) => c.signed || justSigned.has(c.slug));
  const ackedUnsigned = unsigned.filter((c) => acked[c.slug]);

  /** Signs ONLY the consents whose acknowledgment box is checked. */
  const sign = async (toSign: SignableConsent[]) => {
    if (toSign.length === 0)
      return toast.error("Check the acknowledgment on a consent to sign it");
    if (signerName.trim().length < 2) return toast.error("Type your full legal name to sign");
    setSigning(true);
    try {
      const rows = toSign.map((c) => ({
        user_id: userId,
        consent_template_id: c.id,
        template_version: c.version,
        signature_text: signerName.trim(),
        signed_user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
      }));
      const { error } = await supabase.from("consent_signatures").insert(rows);
      if (error) throw error;
      const slugs = toSign.map((c) => c.slug);
      setJustSigned((s) => new Set([...s, ...slugs]));
      toast.success(slugs.length > 1 ? `Signed ${slugs.length} consents` : `Signed: ${toSign[0].title}`);
      onSigned?.(slugs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign");
    } finally {
      setSigning(false);
    }
  };


  return (
    <div className="space-y-5">
      {onFile.length > 0 && compact && (
        <ul className="border border-border divide-y divide-border text-sm">
          {onFile.map((c) => (
            <li key={c.slug} className="flex items-center justify-between gap-3 p-3">
              <span className="text-muted-foreground">{c.title}</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-accent">
                <CheckCircle2 className="h-3.5 w-3.5" /> On file
              </span>
            </li>
          ))}
        </ul>
      )}

      {(compact ? unsigned : consents).map((tpl) => {
        const isSigned = tpl.signed || justSigned.has(tpl.slug);
        return (
          <article
            key={tpl.slug}
            className={`border p-5 ${isSigned ? "border-accent/50 bg-accent/5" : "border-border"}`}
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {tpl.scope === "always_required" ? "Required for all patients" : "Product-specific"} · v
                  {tpl.version}
                </div>
                <h3 className="font-serif text-lg mt-1">{tpl.title}</h3>
              </div>
              {isSigned ? (
                <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-accent">
                  <CheckCircle2 className="h-4 w-4" /> Signed
                </span>
              ) : (
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              )}
            </header>

            <pre
              className={`mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground overflow-y-auto border border-border p-4 bg-background font-sans ${
                compact ? "max-h-44" : "max-h-64"
              }`}
            >
              {tpl.body}
            </pre>

            {!isSigned && (
              <label className="mt-4 flex items-start gap-3 text-sm">
                <Checkbox
                  checked={!!acked[tpl.slug]}
                  onCheckedChange={(v) =>
                    setAcked((s) => ({ ...s, [tpl.slug]: v === true }))
                  }
                  className="mt-0.5"
                />
                <span className="text-muted-foreground">
                  I have read and understand this consent.
                </span>
              </label>
            )}
          </article>
        );
      })}

      {unsigned.length > 0 && (
        <div className="border border-border p-5 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Electronic signature
            </div>
            <h3 className="font-serif text-lg mt-1">
              {unsigned.length > 1
                ? `${ackedUnsigned.length} of ${unsigned.length} consents checked`
                : "Sign this consent"}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Only the consents you have checked above are signed. Unchecked consents stay
              unsigned.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Type your full legal name to sign
              </label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="mt-1"
                autoComplete="name"
              />
            </div>
            <button
              type="button"
              onClick={() => sign(ackedUnsigned)}
              disabled={signing || ackedUnsigned.length === 0 || signerName.trim().length < 2}
              className="inline-flex items-center justify-center bg-ink text-primary-foreground px-6 py-3 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors disabled:opacity-60"
            >
              {signing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : ackedUnsigned.length > 1 ? (
                `Sign ${ackedUnsigned.length} checked consents`
              ) : (
                "Sign checked consent"
              )}
            </button>
          </div>
          {ackedUnsigned.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Check the acknowledgment on a consent above to sign it.
            </p>
          )}
        </div>
      )}

    </div>
  );
}
