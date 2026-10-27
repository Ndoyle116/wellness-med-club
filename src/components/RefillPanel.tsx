import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getRefillEligibility } from "@/lib/refills.functions";
import { RefillRequestDialog } from "@/components/RefillRequestDialog";
import { formatMoney } from "@/lib/refills";
import type { RefillEligibility } from "@/lib/refills";

/**
 * Shown on the product page for refillable medications (testosterone,
 * phentermine). Lets a qualified patient reorder without another visit —
 * still subject to provider review.
 */
export function RefillPanel({ productId }: { productId: string }) {
  const { user } = useAuth();
  const fetchFn = useServerFn(getRefillEligibility);
  const [state, setState] = useState<RefillEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    fetchFn({ data: { productId } })
      .then((r) => setState(r as RefillEligibility))
      .catch(() => setState(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, productId]);

  useEffect(load, [load]);

  if (!user || loading) return null;
  if (!state || !state.supported) return null;

  return (
    <div className="border border-border bg-secondary/40 p-5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <RefreshCw className="h-3.5 w-3.5" /> Refills
      </div>

      {state.pending ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-foreground/80">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          Refill submitted — <strong className="font-semibold">Pending Provider Review and
          Approval</strong>. Your card is authorised and will only be charged if approved.
        </p>
      ) : state.qualified ? (
        <>
          <p className="mt-3 text-sm text-foreground/80">
            You have <strong>{state.remaining}</strong> refill
            {state.remaining === 1 ? "" : "s"} available — no new telehealth visit needed.
            Every refill is <strong>Pending Provider Review and Approval</strong>.
          </p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-4 w-full min-h-12 px-5 py-3 text-xs uppercase tracking-[0.18em] font-semibold bg-ink text-primary-foreground hover:bg-accent transition-colors"
          >
            Request refill — {formatMoney(state.amountCents)} on approval
          </button>
          <RefillRequestDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            productId={productId}
            productName={state.productName}
            amountCents={state.amountCents}
            refillNumber={state.used + 1}
            onSubmitted={load}
          />
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{state.blockedReason}</p>
      )}

      {state.refillNote && (
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{state.refillNote}</p>
      )}
    </div>
  );
}

export function RefillLoading() {
  return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
}
