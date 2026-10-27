import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, IdCard, Loader2, CheckCircle2 } from "lucide-react";
import { getStripe } from "@/lib/stripe";
import { getStripeConfig } from "@/lib/stripe-config.functions";
import {
  createManualLabReviewPayment,
  finalizeManualLabReviewPayment,
} from "@/lib/lab-review-fee.functions";
import { MANUAL_LAB_REVIEW_FEE_CENTS, formatFee } from "@/lib/lab-review-fee";
import { Button } from "@/components/ui/button";

const MAX_SIZE = 15 * 1024 * 1024;
const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.webp,.heic";

type DocType = "lab_result" | "id_license";

type Uploaded = { id: string; name: string; path: string };

type FeeSession = {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  productName: string;
};

export function LabUploadDialog({
  open,
  onOpenChange,
  userId,
  productId,
  productName,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  productId: string;
  productName?: string;
  submitting?: boolean;
  onSubmit: (documentIds: string[]) => void | Promise<void>;
}) {
  const [lab, setLab] = useState<Uploaded | null>(null);
  const [id, setId] = useState<Uploaded | null>(null);
  const [paying, setPaying] = useState(false);
  const [session, setSession] = useState<FeeSession | null>(null);
  const [config, setConfig] = useState<{
    publishableKey: string | null;
    environment: "sandbox" | "live";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useServerFn(getStripeConfig);
  const createFee = useServerFn(createManualLabReviewPayment);

  useEffect(() => {
    if (!open) {
      setPaying(false);
      setSession(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadConfig()
      .then((cfg) => !cancelled && setConfig(cfg))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const documentIds = [lab, id].filter(Boolean).map((u) => (u as Uploaded).id);

  const startPayment = async () => {
    if (!config?.publishableKey) {
      setError("Card payments are not fully configured yet. Please contact us.");
      return;
    }
    setPaying(true);
    setError(null);
    try {
      const res = await createFee({
        data: { productId, documentIds, environment: config.environment },
      });
      setSession(res as FeeSession);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start the review fee payment.");
      setPaying(false);
    }
  };

  const stripePromise = config?.publishableKey ? getStripe(config.publishableKey) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {session ? "Pay the lab review fee" : "Upload your labs & ID"}
          </DialogTitle>
          <DialogDescription>
            {session
              ? `A clinician reviews your uploaded blood work for a flat ${formatFee(
                  MANUAL_LAB_REVIEW_FEE_CENTS,
                )} review fee.`
              : `Upload blood work from the last 6 months and a government-issued ID. Manual lab review costs ${formatFee(
                  MANUAL_LAB_REVIEW_FEE_CENTS,
                )}.${productName ? ` ${productName} is not charged until your provider approves.` : ""}`}
          </DialogDescription>
        </DialogHeader>

        {session && stripePromise && config ? (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: session.clientSecret, appearance: { theme: "flat" } }}
          >
            <ReviewFeeForm
              session={session}
              environment={config.environment}
              productId={productId}
              documentIds={documentIds}
              onPaid={async () => {
                await onSubmit(documentIds);
              }}
            />
          </Elements>
        ) : (
          <>
            <div className="space-y-4">
              <UploadZone
                userId={userId}
                docType="lab_result"
                label="Lab results"
                hint="PDF or image of your recent blood work"
                icon={FileText}
                uploaded={lab}
                onUploaded={setLab}
              />
              <UploadZone
                userId={userId}
                docType="id_license"
                label="ID / Driver's license"
                hint="Required by the pharmacy — clear photo of the front"
                icon={IdCard}
                uploaded={id}
                onUploaded={setId}
              />
            </div>

            <div className="flex items-center justify-between border border-border bg-muted/30 px-4 py-3 text-sm">
              <span className="text-foreground/80">Clinician lab review</span>
              <span className="font-semibold">{formatFee(MANUAL_LAB_REVIEW_FEE_CENTS)}</span>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="button"
              disabled={!lab || !id || !!submitting || paying}
              onClick={() => void startPayment()}
              className="w-full mt-2 min-h-12 px-5 py-3 text-xs uppercase tracking-[0.18em] font-semibold bg-ink text-primary-foreground hover:bg-accent transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {paying
                ? "Preparing payment…"
                : `Continue — pay ${formatFee(MANUAL_LAB_REVIEW_FEE_CENTS)} review fee`}
            </button>
            {(!lab || !id) && (
              <p className="text-[11px] text-muted-foreground text-center">
                Upload both your lab results and your ID to continue.
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewFeeForm({
  session,
  environment,
  productId,
  documentIds,
  onPaid,
}: {
  session: FeeSession;
  environment: "sandbox" | "live";
  productId: string;
  documentIds: string[];
  onPaid: () => Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const finalize = useServerFn(finalizeManualLabReviewPayment);
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
      setError(payError.message ?? "Payment failed.");
      setBusy(false);
      return;
    }
    try {
      await finalize({
        data: {
          paymentIntentId: session.paymentIntentId,
          productId,
          documentIds,
          environment,
        },
      });
      await onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your labs for review.");
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex justify-between border border-border bg-muted/30 p-4 text-sm">
        <span className="text-foreground/80">Lab review — {session.productName}</span>
        <span className="font-semibold">{formatFee(session.amountCents)}</span>
      </div>

      <PaymentElement />

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        The {formatFee(session.amountCents)} review fee covers your provider reading and
        signing off on the blood work you uploaded. Your medication is not charged unless
        you are approved.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={!stripe || busy} className="w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Pay {formatFee(session.amountCents)} & submit for review
      </Button>
    </form>
  );
}


function UploadZone({
  userId,
  docType,
  label,
  hint,
  icon: Icon,
  uploaded,
  onUploaded,
}: {
  userId: string;
  docType: DocType;
  label: string;
  hint: string;
  icon: typeof FileText;
  uploaded: Uploaded | null;
  onUploaded: (u: Uploaded) => void;
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

      const { data: row, error: insErr } = await supabase.from("patient_documents").insert({
        user_id: userId,
        doc_type: docType,
        file_path: path,
        file_name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
      }).select("id").single();
      if (insErr) throw insErr;

      onUploaded({ id: row.id, name: file.name, path });
      toast.success(`${label} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <label
      className={`block min-h-20 border border-dashed border-border p-4 cursor-pointer transition-colors ${
        uploading ? "opacity-60" : "hover:border-accent hover:bg-accent/5"
      }`}
      aria-label={uploaded ? `${label} uploaded` : `Upload ${label}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        disabled={uploading}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex items-start gap-3">
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-0.5" />
        ) : uploaded ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
        ) : (
          <Icon className="h-5 w-5 text-accent mt-0.5" />
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-muted-foreground truncate">
            {uploaded ? uploaded.name : hint}
          </div>
        </div>
        {!uploaded && !uploading && (
          <Upload className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
        )}
      </div>
    </label>
  );
}
