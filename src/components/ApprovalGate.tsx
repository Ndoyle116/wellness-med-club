import { isApprovalStillValid } from "@/lib/approval-state";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  Clock,
  XCircle,
  FlaskConical,
  Upload,
  ShieldCheck,
  ShoppingBag,
  Mail,
  Video,
  Lock,
} from "lucide-react";
import {
  getMyApprovalForProduct,
  requestProductApproval,
} from "@/lib/approvals.functions";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/integrations/supabase/client";
import {
  getLabRoute,
  panelsForSex,
  
  LAB_CHARGE_DISCLOSURE,
  type PatientSex,
} from "@/lib/lab-routing";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { LabUploadDialog } from "@/components/LabUploadDialog";
import { LabPanelPaymentDialog } from "@/components/LabPanelPaymentDialog";
import { AppointmentPicker } from "@/components/AppointmentPicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Category = Database["public"]["Enums"]["product_category"];

export type ApprovalStatus =
  | "none"
  | "pending"
  | "approved"
  | "disapproved"
  | "consumed";

type LabPanel = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  category: Category;
  requires_consultation: boolean;
  requires_labs: boolean;
  is_controlled: boolean;
};

const money = (c: number) => `$${(c / 100).toFixed(2)}`;

/**
 * Renders in place of the buy-now buttons for lab-required products.
 * Emits `onApproved` so the parent PDP can re-enable purchase controls.
 */
export function ApprovalGate({
  productId,
  productSlug = "",
  productName = "",
  productCategory,
  onStatusChange,
}: {
  productId: string;
  productSlug?: string;
  productName?: string;
  productCategory?: Category;
  onStatusChange?: (status: ApprovalStatus) => void;
}) {
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const getStatus = useServerFn(getMyApprovalForProduct);
  const request = useServerFn(requestProductApproval);
  const [status, setStatus] = useState<ApprovalStatus>("none");
  const [requestedVia, setRequestedVia] = useState<"uploaded_labs" | "purchased_labs" | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Lab-routing UI state
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [sex, setSex] = useState<PatientSex | null>(null);
  const [panels, setPanels] = useState<LabPanel[]>([]);
  const [panelsLoading, setPanelsLoading] = useState(false);
  // null = still checking. Whether the patient has actually PAID for a lab panel.
  const [labPaid, setLabPaid] = useState<boolean | null>(null);

  // Patient was denied on uploaded labs and chose to buy the correct panel.
  const [showDenialPanels, setShowDenialPanels] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payPanelId, setPayPanelId] = useState<string | null>(null);
  const [bookedAppt, setBookedAppt] = useState<{ id: string; scheduled_for: string } | null>(null);

  const route = getLabRoute(productSlug, productName, productCategory ?? "peptides");

  // Patient asked for a purchased panel but the lab fee still isn't paid —
  // they must be able to (re)pick and pay for the correct panel.
  const awaitingLabPayment =
    status === "pending" && requestedVia === "purchased_labs" && labPaid === false;
  const showPanelPicker = answer === "no" || awaitingLabPayment || showDenialPanels;



  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setLoading(false);
      setStatus("none");
      onStatusChange?.("none");
      return;
    }
    setLoading(true);
    getStatus({ data: { productId } })
      .then((r) => {
        if (cancelled) return;
        // A consumed panel we ordered keeps clearing the gate; a consumed
        // outside upload is spent and must be re-submitted for each order.

        const raw = (r.approval?.status ?? "none") as ApprovalStatus;
        const s: ApprovalStatus =
          raw === "consumed" && r.approval && isApprovalStillValid(r.approval)
            ? "approved"
            : raw;
        setStatus(s);
        setRequestedVia((r.approval?.requested_via ?? null) as "uploaded_labs" | "purchased_labs" | null);
        setReason(r.approval?.reason ?? null);
        onStatusChange?.(s);
      })
      .catch(() => {
        setStatus("none");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user?.id]);

  // Surface an already-scheduled upcoming visit instead of offering a second booking.
  useEffect(() => {
    if (!user || status !== "approved" || !route?.telehealthRequired) return;
    let cancelled = false;
    supabase
      .from("appointments")
      .select("id, scheduled_for")
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .eq("purpose", "pre_purchase_consult")
      .eq("product_id", productId)
      .gt("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(1)
      .then(({ data }) => {
        const appt = data?.[0];
        if (!cancelled && appt?.scheduled_for) {
          setBookedAppt({ id: appt.id, scheduled_for: appt.scheduled_for });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, status, route?.telehealthRequired]);

  // Load the routed panels once the patient chooses "No, I need to order labs".
  useEffect(() => {
    if (!showPanelPicker || !route) return;
    const slugs = panelsForSex(route, sex);
    if (slugs.length === 0) {
      setPanels([]);
      return;
    }
    let cancelled = false;
    setPanelsLoading(true);
    supabase
      .from("products")
      .select(
        "id, slug, name, price_cents, category, requires_consultation, requires_labs, is_controlled",
      )
      .in("slug", slugs)
      .eq("active", true)
      .then(({ data }) => {
        if (cancelled) return;
        const rows = (data ?? []) as LabPanel[];

        setPanels(rows);
        setPanelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPanelPicker, sex, productSlug]);


  // Labs are a separate purchase — check whether one has actually been paid for.
  useEffect(() => {
    if (!user || status !== "pending" || requestedVia !== "purchased_labs") return;
    let cancelled = false;
    supabase
      .from("order_items")
      .select("order_id, orders!inner(paid_at)")
      .eq("product_category_snapshot", "lab_panel")
      .then(({ data }) => {
        if (cancelled) return;
        const rows = (data ?? []) as Array<{ orders: { paid_at: string | null } | null }>;
        setLabPaid(rows.some((r) => Boolean(r.orders?.paid_at)));
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, status, requestedVia]);


  const submit = async (
    via: "uploaded_labs" | "purchased_labs",
    documentIds?: string[],
  ) => {
    if (!user) {
      toast.error("Please sign in to request approval.");
      return;
    }
    setSubmitting(true);
    try {
      // Idempotent server-side: creates the request, or merges docs into the
      // existing pending/approved one, or reopens a disapproved one.
      const res = await request({
        data: {
          productId,
          requestedVia: via,
          ...(documentIds?.length ? { documentIds } : {}),
        },
      });
      const next = ((res as { status?: string } | null)?.status ?? "pending") as ApprovalStatus;
      setStatus(next);
      setRequestedVia(via);
      onStatusChange?.(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to request approval.");
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const chooseUpload = () => setUploadOpen(true);

  const submitUploads = async (documentIds: string[]) => {
    try {
      await submit("uploaded_labs", documentIds);
      setUploadOpen(false);
      toast.success("Submitted — Nicole reviews your labs and approves here.");
    } catch {
      /* handled */
    }
  };

  const uploadDialog = user ? (
    <LabUploadDialog
      open={uploadOpen}
      onOpenChange={setUploadOpen}
      userId={user.id}
      productId={productId}
      productName={productName}
      submitting={submitting}
      onSubmit={submitUploads}
    />
  ) : null;



  // Inline Stripe payment: the lab fee is charged immediately and the
  // medication amount is authorised, then captured on clinician approval.
  const buyPanel = (panel: LabPanel) => {
    setPayPanelId(panel.id);
    setPayOpen(true);
  };

  const payDialog = (
    <LabPanelPaymentDialog
      open={payOpen}
      onOpenChange={setPayOpen}
      productId={productId}
      panelProductId={payPanelId}
      onPaid={() => {
        setStatus("pending");
        setRequestedVia("purchased_labs");
        setLabPaid(true);
        onStatusChange?.("pending");
      }}
    />
  );

  const panelPicker = (
    <div className="border border-border bg-card p-5 space-y-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
        Order the correct lab panel
      </div>

      {route?.sexDependent && (
        <div className="space-y-2">
          <div className="text-sm text-foreground/80">
            To show the correct panel, please confirm your sex:
          </div>
          <div className="flex gap-2">
            {(["male", "female"] as PatientSex[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                className={`px-4 py-2 text-xs uppercase tracking-[0.18em] font-semibold border transition-colors ${
                  sex === s
                    ? "bg-ink text-primary-foreground border-ink"
                    : "border-border hover:border-foreground"
                }`}
              >
                {s === "male" ? "Male" : "Female"}
              </button>
            ))}
          </div>
          {sex === "female" && (
            <p className="text-[11px] text-muted-foreground">
              Pregnancy screening is included when clinically indicated.
            </p>
          )}
        </div>
      )}

      {!route && (
        <p className="text-sm text-muted-foreground">
          No standard panel is mapped to this product — please message your
          provider and she'll send the right requisition.
        </p>
      )}

      {route && (route.sexDependent ? sex : true) && (
        <div className="space-y-3">
          {panelsLoading && (
            <div className="text-sm text-muted-foreground">Loading panels…</div>
          )}
          {!panelsLoading && panels.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No panel is available online for this product right now — message your
              provider and she'll send the right requisition.
            </p>
          )}
          {panels.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-border p-4"
            >
              <div>
                <div className="text-sm font-semibold text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{money(p.price_cents)}</div>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => buyPanel(p)}
                className="px-4 py-2 text-xs uppercase tracking-[0.18em] font-semibold bg-ink text-primary-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Pay {money(p.price_cents)} for this panel
              </button>
            </div>
          ))}
          <p className="text-xs text-foreground/80">
            This lab panel will be charged today.{" "}
            {productName || "This medication"} remains pending until your results
            are reviewed and you are approved for treatment.
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {LAB_CHARGE_DISCLOSURE}
          </p>
        </div>
      )}
    </div>
  );



  if (loading) return null;

  if (!user) {
    return (
      <div className="border border-accent/40 bg-accent/5 p-5">
        <div className="text-[10px] uppercase tracking-[0.22em] text-accent font-semibold mb-2">
          Lab review required
        </div>
        <p className="text-sm text-foreground/80">
          This medication requires clinician-approved lab work.{" "}
          <Link
            to="/login"
            search={{ redirect: typeof window !== "undefined" ? window.location.pathname : "/" }}
            className="underline underline-offset-2"
          >
            Sign in
          </Link>{" "}
          to request approval.
        </p>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="space-y-4">
        <div className="border border-emerald-500/50 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <div className="text-[10px] uppercase tracking-[0.22em] font-semibold">
              Lab review approved
            </div>
          </div>
          <p className="text-sm text-foreground/80">
            {route?.telehealthRequired
              ? "Your labs were reviewed and accepted. You can now book and pay for your telehealth visit at checkout — this is your treatment-approval visit."
              : "You're cleared to purchase. This approval is valid for one order — a new request is required for any future purchase."}
          </p>
        </div>
        {route?.telehealthRequired && (
          <div className="space-y-3">
            <div className="border border-emerald-500/40 bg-card p-4 flex gap-3">
              <Video className="h-4 w-4 mt-0.5 text-emerald-700 flex-none" />
              <p className="text-sm text-foreground/80">
                <span className="font-semibold">Telehealth unlocked.</span> Pick your
                15-minute visit time below — it carries over to checkout.
              </p>
            </div>
            <AppointmentPicker
              purpose="pre_purchase_consult"
              productId={productId}
              durationMinutes={15}
              helper="Pick a 15-minute provider visit"
              bookedAppointment={bookedAppt}
              onBooked={(id, slot) => setBookedAppt({ id, scheduled_for: slot.start_at })}
            />
          </div>
        )}

      </div>
    );
  }


  if (status === "pending") {
    const awaitingLabResults = requestedVia === "purchased_labs";
    const uploadsSubmitted = requestedVia === "uploaded_labs";
    const labInCart = cart.items.some((i) => i.category === "lab_panel");
    // Step 1 is always the choice: upload existing results, or buy a panel.
    // The awaiting/status card is only the second section, shown once the
    // patient has actually uploaded (or is waiting on a paid panel).
    const showAwaitingCard = uploadsSubmitted || awaitingLabPayment;
    return (
      <div className="space-y-4">
        {!uploadsSubmitted && (
          <div className="border border-accent/40 bg-accent/5 p-5 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent font-semibold">
              Provide your labs
            </div>
            <div className="text-sm font-semibold text-foreground">
              Have you had {route?.label ?? "the required"} labs completed in the last 6 months?
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setAnswer(null);
                  setUploadOpen(true);
                }}
                className="flex items-center justify-center gap-2 p-3 text-xs uppercase tracking-[0.18em] font-semibold border border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                Yes, upload my results
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setAnswer("no")}
                className={`flex items-center justify-center gap-2 p-3 text-xs uppercase tracking-[0.18em] font-semibold transition-colors disabled:opacity-50 ${
                  answer === "no"
                    ? "bg-accent text-primary-foreground"
                    : "bg-ink text-primary-foreground hover:bg-accent"
                }`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                No, I need to order labs
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Uploaded results must be dated within the last 6 months. Manual lab review is $20.
            </p>
          </div>
        )}

        {showAwaitingCard && (
        <div className="border border-amber-500/50 bg-amber-500/5 p-5">


          <div className="flex items-center gap-2 text-amber-700 mb-1">
            <Clock className="h-4 w-4" />
            <div className="text-[10px] uppercase tracking-[0.22em] font-semibold">
              {awaitingLabPayment
                ? "Lab payment required"
                : awaitingLabResults
                  ? "Awaiting lab results"
                  : "Pending approval"}
            </div>
          </div>
          <p className="text-sm text-foreground/80">
            {awaitingLabPayment
              ? labInCart
                ? `Your lab panel is in your cart but hasn't been paid for yet. Labs are a separate purchase — once the lab fee is paid we place your requisition with the testing facility. ${productName || "Your medication"} is not charged unless you're approved.`
                : `Your lab fee hasn't been paid yet. Choose your panel below and pay for it — or upload results from the last 6 months instead. ${productName || "Your medication"} is not charged unless you're approved.`
              : awaitingLabResults
                ? "Your lab fee has been paid and your blood work is being processed by the testing facility. Your medication charge stays pending until your provider (Nicole) reviews the results and approves."
                : "Your labs are with your provider (Nicole) for review. Your medication charge stays pending until approval."}
          </p>
          {awaitingLabPayment && labInCart && (
            <button
              type="button"
              onClick={() => navigate({ to: "/checkout" })}
              className="mt-3 px-4 py-2 text-xs uppercase tracking-[0.18em] font-semibold bg-ink text-primary-foreground hover:bg-accent transition-colors"
            >
              Pay for my labs
            </button>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              disabled={uploadsSubmitted || submitting}
              onClick={() => setUploadOpen(true)}
              className="inline-flex min-h-10 items-center justify-center border border-foreground px-4 py-2 text-xs uppercase tracking-[0.16em] font-semibold transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:border-border disabled:bg-muted/40 disabled:text-muted-foreground disabled:hover:bg-muted/40 disabled:hover:text-muted-foreground"
            >
              {uploadsSubmitted ? "Labs & ID submitted" : awaitingLabResults ? "Upload results manually" : "Upload labs & ID"}
            </button>
            <Link
              to="/account"
              className="inline-flex min-h-10 items-center justify-center border border-border px-4 py-2 text-xs uppercase tracking-[0.16em] font-semibold transition-colors hover:border-foreground hover:bg-card"
            >
              View status
            </Link>
          </div>
        </div>
        )}

        {(awaitingLabPayment || answer === "no") && panelPicker}


        {route?.telehealthRequired ? <TelehealthLocked /> : null}

        <div className="border border-border bg-muted/20 p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Mail className="h-4 w-4" />
            <div className="text-[10px] uppercase tracking-[0.22em] font-semibold">
              What happens next
            </div>
          </div>
          <ol className="text-sm text-foreground/80 space-y-1.5 list-decimal list-inside">
            {awaitingLabPayment && (
              <li>You pay the lab fee at checkout so we can place your requisition.</li>
            )}
            {awaitingLabResults && (
              <li>The testing facility emails you when your blood work is complete.</li>
            )}

            <li>Your provider (Nicole) reviews your results first.</li>
            {route?.telehealthRequired && (
              <li>
                If your labs are accepted, telehealth booking unlocks and you pick
                and pay for your visit.
              </li>
            )}
            <li>
              Once approved, your medication charge is captured and your order ships.
            </li>
          </ol>
        </div>
        {uploadDialog}
      {payDialog}
      </div>
    );
  }


  if (status === "disapproved") {
    return (
      <div className="space-y-4">
        <div className="border border-destructive/50 bg-destructive/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" />
            <div className="text-[10px] uppercase tracking-[0.22em] font-semibold">
              Labs not accepted
            </div>
          </div>
          {reason && (
            <p className="text-sm text-foreground/80">
              <span className="font-semibold">Clinician's note:</span> {reason}
            </p>
          )}
          <p className="text-sm text-foreground/80">
            Your medication was not charged
            {route?.telehealthRequired
              ? " and telehealth booking stays locked until acceptable labs are approved."
              : "."}{" "}
            You can order the correct Wellness Med Club panel below — the lab fee is
            charged today and your treatment stays pending until the new results are
            reviewed.
          </p>
          {!showDenialPanels && (
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowDenialPanels(true)}
                className="px-4 py-2 text-xs uppercase tracking-[0.18em] font-semibold bg-ink text-primary-foreground hover:bg-accent transition-colors"
              >
                Order the correct lab panel
              </button>
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="px-4 py-2 text-xs uppercase tracking-[0.18em] font-semibold border border-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                Upload corrected results
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Any laboratory fee already paid is non-refundable, since the order was
            placed with the testing facility.
          </p>
        </div>

        {showDenialPanels && panelPicker}
        {route?.telehealthRequired && <TelehealthLocked />}
        {uploadDialog}
      {payDialog}
      </div>
    );
  }


  // status === "none" or "consumed" — run the lab question flow
  return (
    <div className="space-y-4">
      <div className="border border-accent/40 bg-accent/5 p-5 space-y-4">
        {route?.telehealthRequired && <TelehealthLocked />}





        <div className="pt-3 border-t border-accent/20 space-y-3">
          <div className="text-sm font-semibold text-foreground">
            Have you had {route?.label ?? "the required"} labs completed in the last 6 months?
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={chooseUpload}
              className="flex items-center justify-center gap-2 p-3 text-xs uppercase tracking-[0.18em] font-semibold border border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Yes, upload my results
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setAnswer("no")}
              className={`flex items-center justify-center gap-2 p-3 text-xs uppercase tracking-[0.18em] font-semibold transition-colors disabled:opacity-50 ${
                answer === "no"
                  ? "bg-accent text-primary-foreground"
                  : "bg-ink text-primary-foreground hover:bg-accent"
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              No, I need to order labs
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Uploaded results must be dated within the last 6 months. Manual lab review is $20.
          </p>
        </div>
      </div>

      {answer === "no" && panelPicker}
      {uploadDialog}
      {payDialog}
    </div>
  );
}

/**
 * Shows the "how to purchase" explainer as a popup the first time a customer
 * lands on the product page, with a compact summary + reopen link inline.
 */
export function HowToPurchaseIntro({
  telehealthRequired,
  intro,
  productId,
}: {
  telehealthRequired: boolean;
  intro: string;
  productId: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `how-to-purchase:${productId}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    setOpen(true);
  }, [productId]);

  return (
    <>
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.22em] text-accent font-semibold">
          Prescription therapy — how to purchase
        </div>
        <p className="text-sm text-foreground/80">{intro}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs uppercase tracking-[0.18em] font-semibold underline underline-offset-4 text-foreground hover:text-accent transition-colors"
        >
          View the steps
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How to purchase this medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <HowToPurchaseSteps
              telehealthRequired={telehealthRequired}
              intro={intro}
            />
          </div>
          <Button type="button" className="w-full" onClick={() => setOpen(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Shared "how to purchase" explainer so every lab-gated state shows the same flow. */
function HowToPurchaseSteps({
  telehealthRequired,
  intro,
}: {
  telehealthRequired: boolean;
  intro: string;
}) {
  return (
    <>
      <div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-accent font-semibold mb-1">
          Prescription therapy — how to purchase
        </div>
        <p className="text-sm text-foreground/80">{intro}</p>
      </div>

      <ol className="space-y-3">
        <StepRow
          n={1}
          icon={<Upload className="h-4 w-4" />}
          title="Submit your labs"
          body="Upload blood work from the last 6 months — or order the correct lab panel below. Lab fees are charged today."
        />
        <StepRow
          n={2}
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Provider reviews your labs"
          body={
            telehealthRequired
              ? "Nicole reviews your results first. If they're incomplete or older than 6 months, she'll explain what's missing and you can order the correct panel."
              : "Nicole reviews your results and approves — no call required."
          }
        />
        {telehealthRequired && (
          <StepRow
            n={3}
            icon={<Video className="h-4 w-4" />}
            title="Telehealth unlocks after lab approval"
            body="You can't book or pay for the visit until your labs are accepted. Once approved, you select a slot and pay for your treatment-approval visit."
          />
        )}
        <StepRow
          n={telehealthRequired ? 4 : 3}
          icon={<ShoppingBag className="h-4 w-4" />}
          title="Purchase & ship"
          body="Only the medication charge is captured at this point — any lab fee was already charged in step 1. Approval is single-use."
        />
      </ol>
    </>
  );
}


function TelehealthLocked() {
  return (
    <div className="border border-border bg-muted/20 p-4 flex gap-3">
      <Lock className="h-4 w-4 mt-0.5 text-muted-foreground flex-none" />
      <p className="text-sm text-foreground/80">
        <span className="font-semibold">Telehealth booking locked.</span> Your labs
        must be reviewed and accepted first. Once approved, you'll be notified and
        can select and pay for your telehealth visit.
      </p>
    </div>
  );
}



function StepRow({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex-none flex items-center justify-center h-7 w-7 rounded-full bg-ink text-primary-foreground text-xs font-semibold">
        {n}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span className="text-accent">{icon}</span>
          {title}
        </div>
        <p className="text-xs text-foreground/70 mt-0.5 leading-relaxed">{body}</p>
      </div>
    </li>
  );
}
