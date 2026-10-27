import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { IdDocumentUpload } from "@/components/IdDocumentUpload";
import { getStripe } from "@/lib/stripe";
import { getStripeConfig } from "@/lib/stripe-config.functions";
import {
  createLabPanelPayment,
  finalizeLabPanelPayment,
  getLabPurchaseConsents,
} from "@/lib/lab-payment.functions";
import { ConsentSignBlock, type SignableConsent } from "@/components/ConsentSignBlock";
import { useAuth } from "@/lib/auth-context";

const money = (c: number) => `$${(c / 100).toFixed(2)}`;

type Session = {
  orderId: string;
  clientSecret: string;
  labTotalCents: number;
  medicationTotalCents: number;
  panelName: string;
  medicationName: string;
};

function PayForm({
  session,
  environment,
  onDone,
}: {
  session: Session;
  environment: "sandbox" | "live";
  onDone: (orderId: string) => void;
}) {

  const stripe = useStripe();
  const elements = useElements();
  const finalize = useServerFn(finalizeLabPanelPayment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questAcked, setQuestAcked] = useState(false);

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
      setError(payError.message ?? "Payment failed.");
      setBusy(false);
      return;
    }
    try {
      const res = await finalize({
        data: { orderId: session.orderId, environment },
      });
      if (!res.held && "reason" in res && res.reason) toast.warning(res.reason);
    } catch {
      /* the lab fee is paid — the hold is retried by staff if needed */
    }
    toast.success("Lab fee charged and your order is placed.");
    onDone(session.orderId);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="border border-border bg-muted/30 p-4 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground/80">{session.panelName} — charged today</span>
          <span className="font-semibold">{money(session.labTotalCents)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>{session.medicationName} — authorised, not charged</span>
          <span>{money(session.medicationTotalCents)}</span>
        </div>
      </div>

      <PaymentElement />

      <label className="flex items-start gap-3 border border-border bg-muted/30 p-4 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={questAcked}
          onChange={(e) => setQuestAcked(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-current"
        />
        <span className="text-muted-foreground leading-relaxed">
          I acknowledge that labs purchased through Wellness Med Club are for{" "}
          <span className="font-semibold text-foreground">Quest Diagnostics only</span>{" "}
          and cannot be used at other laboratories. I am responsible for scheduling my
          Quest appointment. My Quest lab slip will be sent within 24 hours of purchase;
          weekends and holidays may cause delays.
        </span>
      </label>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Your card is charged {money(session.labTotalCents)} for the lab panel now. The
        medication amount of {money(session.medicationTotalCents)} is placed on hold and
        is only taken once your labs are reviewed and approved. If you are not approved,
        the hold is released and never charged.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={!stripe || busy || !questAcked} className="w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Pay {money(session.labTotalCents)} & place order
      </Button>
    </form>
  );
}

export function LabPanelPaymentDialog({
  open,
  onOpenChange,
  productId,
  panelProductId,
  onPaid,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  panelProductId: string | null;
  onPaid?: () => void;
}) {
  const create = useServerFn(createLabPanelPayment);
  const loadConsents = useServerFn(getLabPurchaseConsents);
  const loadConfig = useServerFn(getStripeConfig);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [config, setConfig] = useState<{
    publishableKey: string | null;
    environment: "sandbox" | "live";
  } | null>(null);
  const [consents, setConsents] = useState<SignableConsent[] | null>(null);
  const [consentsSatisfied, setConsentsSatisfied] = useState(false);
  const [consentReviewed, setConsentReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idOnFile, setIdOnFile] = useState<boolean | null>(null);

  // Step 0: a government-issued ID must be on file before the first purchase.
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("patient_documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("doc_type", "id_license");
      if (!cancelled) setIdOnFile((count ?? 0) > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user?.id]);


  // Step 1: load the consents this purchase requires.
  useEffect(() => {
    if (!open || !panelProductId) return;
    let cancelled = false;
    setSession(null);
    setConsents(null);
    setConsentsSatisfied(false);
    setConsentReviewed(false);
    setError(null);
    (async () => {
      try {
        const cfg = await loadConfig();
        if (cancelled) return;
        setConfig(cfg);
        if (!cfg.publishableKey) {
          setError(
            "Card payments are not fully configured yet. Please contact us to complete your order.",
          );
          return;
        }
        const res = await loadConsents({ data: { productId, panelProductId } });
        if (cancelled) return;
        const list = (res.consents ?? []) as SignableConsent[];
        if (list.length === 0) {
          throw new Error("The required laboratory consent is unavailable. Payment cannot continue.");
        }
        setConsents(list);
        const allSigned = list.every((c) => c.signed);
        setConsentsSatisfied(allSigned);
        // Consents are signed once, at the first purchase. Returning patients
        // who already have every required consent on file go straight to payment.
        if (allSigned) setConsentReviewed(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to start payment.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, panelProductId, productId]);

  // Step 2: create the payment session only after every consent is on file and
  // the patient has reviewed the consent for this specific lab purchase.
  useEffect(() => {
    if (
      !open ||
      !panelProductId ||
      !consentsSatisfied ||
      !consentReviewed ||
      !config?.publishableKey
    )
      return;
    if (session) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await create({
          data: {
            productId,
            panelProductId,
            quantity: 1,
            environment: config.environment,
          },
        });
        if (!cancelled) setSession(res as Session);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Unable to start payment.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    panelProductId,
    productId,
    consentsSatisfied,
    consentReviewed,
    config?.publishableKey,
  ]);

  if (open && idOnFile === false && user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Photo ID required</DialogTitle>
            <DialogDescription>
              Before your first purchase we need a government-issued ID on file: driver&apos;s
              license, state ID, or passport. It is saved to your patient portal.
            </DialogDescription>
          </DialogHeader>
          <IdDocumentUpload
            userId={user.id}
            compact
            onUploaded={() => setIdOnFile(true)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {consentReviewed ? "Pay for your lab panel" : "Laboratory consent"}
          </DialogTitle>
          <DialogDescription>
            {consentReviewed
              ? "The lab fee is charged now. Your medication is authorised and only charged after your labs are approved."
              : "Review the laboratory consent for this purchase before continuing to payment."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            {error.toLowerCase().includes("consent") && (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  navigate({
                    to: "/account/consents",
                    search: {
                      products: [productId, panelProductId].filter(Boolean).join(","),
                      redirect: typeof window !== "undefined" ? window.location.pathname : undefined,
                    },
                  });
                }}
                className="inline-flex items-center bg-ink text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors"
              >
                Review &amp; sign consents
              </button>
            )}
          </div>
        )}

        {!error && !consentReviewed && consents && user && (
          <div className="space-y-5">
            <ConsentSignBlock
              consents={consents}
              compact
              userId={user.id}
              onSigned={(slugs) => {
                const updated = consents.map((consent) =>
                  slugs.includes(consent.slug) ? { ...consent, signed: true } : consent,
                );
                setConsents(updated);
                setConsentsSatisfied(updated.every((consent) => consent.signed));
              }}
            />
            {consentsSatisfied && (
              <Button
                type="button"
                className="w-full"
                onClick={() => setConsentReviewed(true)}
              >
                I have reviewed the consent — continue to payment
              </Button>
            )}
          </div>
        )}

        {!error && consentReviewed && !session && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Preparing secure payment…
          </div>
        )}

        {!error && !consents && !consentReviewed && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your consent forms…
          </div>
        )}

        {session && config?.publishableKey && (
          <Elements
            stripe={getStripe(config.publishableKey)}
            options={{ clientSecret: session.clientSecret, appearance: { theme: "flat" } }}
          >
            <PayForm
              session={session}
              environment={config.environment}
              onDone={(orderId) => {
                onOpenChange(false);
                onPaid?.();
                navigate({ to: "/account/orders/$orderId", params: { orderId } });
              }}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
