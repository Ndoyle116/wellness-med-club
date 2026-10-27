import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getStripe } from "@/lib/stripe";
import { getStripeConfig } from "@/lib/stripe-config.functions";
import { createRefillPayment, submitRefillRequest } from "@/lib/refills.functions";
import { formatMoney, REFILL_PENDING_COPY } from "@/lib/refills";

type Session = {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  productName: string;
};

/**
 * Refill request flow: the card is authorised here, never captured. The
 * provider captures on approval or releases the hold on decline.
 */
export function RefillRequestDialog({
  open,
  onOpenChange,
  productId,
  productName,
  amountCents,
  refillNumber,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: string;
  productName: string;
  amountCents: number;
  refillNumber: number;
  onSubmitted: () => void;
}) {
  const loadConfig = useServerFn(getStripeConfig);
  const startFn = useServerFn(createRefillPayment);
  const [config, setConfig] = useState<{
    publishableKey: string | null;
    environment: "sandbox" | "live";
  } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSession(null);
      setError(null);
      setBusy(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const cfg = await loadConfig({});
        if (cancelled) return;
        setConfig(cfg as any);
        const s = await startFn({
          data: { productId, environment: (cfg as any).environment },
        });
        if (!cancelled) setSession(s as Session);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to start the refill request.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productId]);

  const stripePromise = config?.publishableKey ? getStripe(config.publishableKey) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Request refill #{refillNumber} — {productName}
          </DialogTitle>
          <DialogDescription>{REFILL_PENDING_COPY}</DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!session ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Preparing your refill request…" : "Refill request unavailable."}
          </div>
        ) : stripePromise && config ? (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: session.clientSecret, appearance: { theme: "flat" } }}
          >
            <RefillForm
              session={session}
              productId={productId}
              environment={config.environment}
              note={note}
              setNote={setNote}
              onDone={() => {
                toast.success("Refill submitted — pending provider review and approval.");
                onOpenChange(false);
                onSubmitted();
              }}
            />
          </Elements>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RefillForm({
  session,
  productId,
  environment,
  note,
  setNote,
  onDone,
}: {
  session: Session;
  productId: string;
  environment: "sandbox" | "live";
  note: string;
  setNote: (v: string) => void;
  onDone: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const submitFn = useServerFn(submitRefillRequest);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: payError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (payError) {
      setError(payError.message ?? "Card authorisation failed.");
      setBusy(false);
      return;
    }
    try {
      await submitFn({
        data: {
          productId,
          paymentIntentId: session.paymentIntentId,
          note: note.trim() || undefined,
          environment,
        },
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your refill request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex justify-between border border-border bg-muted/30 p-4 text-sm">
        <span className="text-foreground/80">{session.productName}</span>
        <span className="font-semibold">{formatMoney(session.amountCents)}</span>
      </div>

      <PaymentElement />

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Note for your provider (optional)
        </label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Dose changes, side effects, anything your provider should know."
        />
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Your card is authorised for {formatMoney(session.amountCents)} today and is only
        charged if your provider approves this refill. If it is declined, the hold is
        released and you are not charged.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={!stripe || busy} className="w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit refill for provider review
      </Button>
    </form>
  );
}
