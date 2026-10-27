import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { useCart, formatPrice } from "@/lib/cart-context";
import {
  cartRequiresIntake,
  fetchRequiredConsentsForCart,
  cartAppointmentProductIds,
  type ConsentRequirement,
} from "@/lib/cart-requirements";
import { supabase } from "@/integrations/supabase/client";
import { StripeEmbeddedCheckoutForm } from "@/components/StripeEmbeddedCheckout";
import { CouponField, type AppliedCoupon } from "@/components/CouponField";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { AppointmentPicker } from "@/components/AppointmentPicker";
import { CheckCircle2, Circle, Loader2, Lock, FlaskConical, Plus, Check } from "lucide-react";
import { getSuggestedLabPanels, isLabPanelSlug, type SuggestedLab } from "@/lib/suggested-labs";
import { listMyApprovedManualLabProductIds } from "@/lib/approvals.functions";
import { isApprovalStillValid } from "@/lib/approval-state";
import { LAB_CHARGE_DISCLOSURE } from "@/lib/lab-routing";
import { IdDocumentUpload } from "@/components/IdDocumentUpload";


export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Wellness Med Club" }] }),
  component: CheckoutPage,
});

type StepStatus = "done" | "todo" | "locked" | "n/a";

function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotalCents, add } = useCart();
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const navigate = useNavigate();
  const listApprovedManualLabs = useServerFn(listMyApprovedManualLabProductIds);

  const [suggestedLabs, setSuggestedLabs] = useState<SuggestedLab[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const approved = user
        ? await listApprovedManualLabs()
        : { productIds: [] as string[] };
      const results = await getSuggestedLabPanels(items, new Set(approved.productIds));
      if (!cancelled) setSuggestedLabs(results);
    })().catch(() => {
      if (!cancelled) getSuggestedLabPanels(items).then(setSuggestedLabs);
    });
    return () => {
      cancelled = true;
    };
  }, [items.map((i) => i.slug).sort().join(","), user?.id]);

  const inCartSlugs = new Set(items.map((i) => i.slug));
  const hasLabInCart = items.some((i) => isLabPanelSlug(i.slug));
  const addLabToCart = (lab: SuggestedLab) => {
    add(
      {
        productId: lab.id,
        slug: lab.slug,
        name: lab.name,
        category: "lab_panel",
        priceCents: lab.priceCents,
        requiresConsultation: false,
        requiresLabs: false,
        isControlled: false,
      },
      1,
    );
  };

  const needsIntake = useMemo(() => cartRequiresIntake(items), [items]);
  const appointmentProducts = useMemo(() => cartAppointmentProductIds(items), [items]);
  const needsAppointment = appointmentProducts.length > 0;
  // The standalone "Zoom call with provider" product is a 30-minute visit;
  // the optional add-on attached to another product is 15 minutes.
  const standaloneTelevisit = useMemo(
    () => items.some((i) => i.category === "telehealth_visit"),
    [items],
  );
  const needsOptionalTelevisit = useMemo(
    () => standaloneTelevisit || items.some((i) => i.addTelevisit),
    [items, standaloneTelevisit],
  );
  const televisitDuration = standaloneTelevisit ? 30 : 15;

  const [required, setRequired] = useState<ConsentRequirement[] | null>(null);
  const [intakeDone, setIntakeDone] = useState<boolean | null>(null);
  const [signedCount, setSignedCount] = useState<number>(0);
  // Visits are per-medication: productId -> booked appointment.
  const [apptByProduct, setApptByProduct] = useState<
    Record<string, { id: string; scheduled_for: string }>
  >({});
  const [apptTargetProduct, setApptTargetProduct] = useState<string | null>(null);
  const [televisitBooked, setTelevisitBooked] = useState<{
    id: string;
    scheduled_for: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [questAcked, setQuestAcked] = useState(false);
  const [showApptPicker, setShowApptPicker] = useState(false);
  const [showTelevisitPicker, setShowTelevisitPicker] = useState(false);
  const [cartRequiresLabs, setCartRequiresLabs] = useState(false);
  const [hasIdDoc, setHasIdDoc] = useState(true);
  const [showIdUpload, setShowIdUpload] = useState(false);


  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login", search: { redirect: "/checkout" } as never });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const req = await fetchRequiredConsentsForCart(items);
      setRequired(req);

      // Determine whether the cart still triggers the lab-review flow. If a
      // provider has already approved labs for a product (uploaded manually or
      // purchased), that product no longer defers the charge.
      const productIds = items.map((i) => i.productId);
      if (productIds.length > 0) {
        const [{ data: prods }, { data: approvals }] = await Promise.all([
          supabase.from("products").select("id, requires_labs, category").in("id", productIds),
          supabase
            .from("product_approvals")
            .select("product_id, status, requested_via, reviewed_at, created_at")
            .eq("user_id", user.id)
            .in("status", ["approved", "consumed"])
            .in("product_id", productIds),
        ]);
        const approvedIds = new Set(
          (approvals ?? []).filter(isApprovalStillValid).map((a) => a.product_id),
        );
        // Lab panels are bought outright — they never defer the charge.
        setCartRequiresLabs(
          (prods ?? []).some(
            (p) => p.requires_labs && p.category !== "lab_panel" && !approvedIds.has(p.id),
          ),
        );
      } else {
        setCartRequiresLabs(false);
      }



      const [{ data: intake }, { data: existingAppt }] = await Promise.all([
        supabase
          .from("intake_responses")
          .select("attestation_signed")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        needsAppointment
          ? supabase
              .from("appointments")
              .select("id, scheduled_for, status, product_id")
              .eq("user_id", user.id)
              .eq("purpose", "pre_purchase_consult")
              .in("status", ["scheduled"])
              .in("product_id", appointmentProducts)
              .gt("scheduled_for", new Date().toISOString())
              .order("scheduled_for", { ascending: true })
          : Promise.resolve({ data: null }),
      ]);
      setIntakeDone(needsIntake ? Boolean(intake?.attestation_signed) : false);
      const apptMap: Record<string, { id: string; scheduled_for: string }> = {};
      for (const a of (existingAppt ?? []) as Array<{
        id: string;
        scheduled_for: string | null;
        product_id: string | null;
      }>) {
        if (a.product_id && a.scheduled_for && !apptMap[a.product_id]) {
          apptMap[a.product_id] = { id: a.id, scheduled_for: a.scheduled_for };
        }
      }
      setApptByProduct(apptMap);

      // Government-issued ID is mandatory before the first purchase and kept
      // on file afterwards.
      const { count: idCount } = await supabase
        .from("patient_documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("doc_type", "id_license");
      setHasIdDoc((idCount ?? 0) > 0);

      if (req.length === 0) {
        setSignedCount(0);
      } else {
        const { data: idRows } = await supabase
          .from("consent_templates")
          .select("id, slug, version")
          .in(
            "slug",
            req.map((r) => r.slug),
          );
        const { data: sigs } = await supabase
          .from("consent_signatures")
          .select("consent_template_id, template_version")
          .eq("user_id", user.id)
          .in(
            "consent_template_id",
            (idRows ?? []).map((r) => r.id),
          );
        const matched = (sigs ?? []).filter((s) =>
          req.some((r) => {
            const row = (idRows ?? []).find(
              (i) => i.id === s.consent_template_id && i.slug === r.slug,
            );
            return row && row.version === s.template_version;
          }),
        );
        setSignedCount(new Set(matched.map((s) => s.consent_template_id)).size);
      }
      setLoading(false);
    })();
  }, [user, needsAppointment, needsIntake, items.map((i) => i.productId).sort().join(",")]);

  if (authLoading || loading || !user || required === null) {
    return (
      <SiteLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  if (items.length === 0) {
    return (
      <SiteLayout>
        <PageHero eyebrow="checkout" title="Your cart is empty" />
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <Link to="/products" className="text-xs uppercase tracking-[0.22em] underline">
            Browse products
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const intakeStatus: StepStatus = needsIntake ? (intakeDone ? "done" : "todo") : "n/a";

  const pendingApptProducts = appointmentProducts.filter((id) => !apptByProduct[id]);
  const nextApptProduct = apptTargetProduct ?? pendingApptProducts[0] ?? null;
  const nextApptProductName =
    items.find((i) => i.productId === nextApptProduct)?.name ?? "this medication";

  const apptStatus: StepStatus = !needsAppointment
    ? "n/a"
    : pendingApptProducts.length === 0
      ? "done"
      : intakeStatus === "todo"
        ? "locked"
        : "todo";

  const consentsStatus: StepStatus =
    required.length === 0
      ? "n/a"
      : signedCount >= required.length
        ? "done"
        : intakeStatus === "todo" || apptStatus === "todo" || apptStatus === "locked"
          ? "locked"
          : "todo";

  const televisitStatus: StepStatus = !needsOptionalTelevisit
    ? "n/a"
    : televisitBooked
      ? "done"
      : consentsStatus === "todo" || consentsStatus === "locked"
        ? "locked"
        : "todo";

  const needsId = items.some((i) => i.category !== "telehealth_visit");
  const idStatus: StepStatus = !needsId ? "n/a" : hasIdDoc ? "done" : "todo";

  const paymentReady =
    (idStatus === "done" || idStatus === "n/a") &&
    (intakeStatus === "done" || intakeStatus === "n/a") &&
    (apptStatus === "done" || apptStatus === "n/a") &&
    (consentsStatus === "done" || consentsStatus === "n/a") &&
    (televisitStatus === "done" || televisitStatus === "n/a");

  // Only render the steps that actually apply to this cart, numbered in order.
  const stepNodes: React.ReactNode[] = [];
  const pushStep = (node: (n: number) => React.ReactNode, extra?: React.ReactNode) => {
    const n = stepNodes.length + 1;
    stepNodes.push(
      <React.Fragment key={n}>
        {node(n)}
        {extra}
      </React.Fragment>,
    );
  };

  if (idStatus !== "n/a") {
    pushStep(
      (n) => (
        <Step
          n={n}
          title="Photo ID"
          status={idStatus}
          description={
            idStatus === "done"
              ? "Government-issued ID on file."
              : "Required before your first order: upload a driver's license, state ID, or passport."
          }
          action={
            idStatus === "todo" && !showIdUpload
              ? { label: "Upload ID", onClick: () => setShowIdUpload(true) }
              : undefined
          }
        />
      ),
      idStatus === "todo" && showIdUpload ? (
        <div className="ml-12 mb-6">
          <IdDocumentUpload
            userId={user.id}
            onUploaded={() => {
              setHasIdDoc(true);
              setShowIdUpload(false);
            }}
          />
        </div>
      ) : null,
    );
  }

  if (intakeStatus !== "n/a") {
    pushStep((n) => (
      <Step
        n={n}
        title="Medical intake"

        status={intakeStatus}
        description={intakeStatus === "done" ? "Completed." : "Tell us about your health history."}
        action={
          intakeStatus === "todo"
            ? {
                to: "/account/intake",
                search: { redirect: "/checkout" },
                label: "Complete intake",
              }
            : undefined
        }
      />
    ));
  }

  if (apptStatus !== "n/a") {
    pushStep(
      (n) => (
        <Step
          n={n}
          title="Pre-purchase provider appointment"
          status={apptStatus}
          description={
            apptStatus === "done"
              ? `${appointmentProducts
                  .map((id) => {
                    const name = items.find((i) => i.productId === id)?.name ?? "Medication";
                    const b = apptByProduct[id];
                    return b
                      ? `${name}: ${new Date(b.scheduled_for).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
                      : name;
                  })
                  .join(" · ")}. You can pick a different time.`
              : apptStatus === "locked"
                ? "Complete intake first."
                : `${nextApptProductName} requires its own 15-minute provider appointment before purchase.`
          }
          action={
            !showApptPicker
              ? apptStatus === "todo"
                ? { label: "Book 15-min slot", onClick: () => setShowApptPicker(true) }
                : apptStatus === "done"
                  ? {
                      label: "Change time",
                      onClick: () => {
                        setApptTargetProduct(appointmentProducts[0] ?? null);
                        setShowApptPicker(true);
                      },
                    }
                  : undefined
              : undefined
          }
        />
      ),
      showApptPicker ? (
        <AppointmentPicker
          purpose="pre_purchase_consult"
          productId={nextApptProduct}
          durationMinutes={15}
          helper={`Pick a 15-minute consult for ${nextApptProductName}`}
          onBooked={(id, slot) => {
            if (nextApptProduct) {
              setApptByProduct((m) => ({
                ...m,
                [nextApptProduct]: { id, scheduled_for: slot.start_at },
              }));
            }
            setApptTargetProduct(null);
            setShowApptPicker(false);
          }}
          onCancelPick={() => {
            setApptTargetProduct(null);
            setShowApptPicker(false);
          }}
          previousAppointmentId={
            (nextApptProduct && apptByProduct[nextApptProduct]?.id) || null
          }
        />
      ) : null,
    );
  }

  if (consentsStatus !== "n/a") {
    pushStep((n) => (
      <Step
        n={n}
        title="Consents for this order"
        status={consentsStatus}
        description={
          consentsStatus === "locked"
            ? "Complete the steps above first."
            : `${signedCount} of ${required.length} signed.`
        }
        action={
          consentsStatus === "todo"
            ? {
                to: "/account/consents",
                search: { redirect: "/checkout" },
                label: "Review consents",
              }
            : undefined
        }
      />
    ));
  }

  if (televisitStatus !== "n/a") {
    const showPicker =
      televisitStatus === "todo" && (showTelevisitPicker || standaloneTelevisit);
    pushStep(
      (n) => (
        <Step
          n={n}
          title={standaloneTelevisit ? "Pick your Zoom call time" : "Optional Zoom call with our NP"}
          status={televisitStatus}
          description={
            televisitStatus === "done"
              ? `Booked for ${televisitBooked ? new Date(televisitBooked.scheduled_for).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}.`
              : televisitStatus === "locked"
                ? "Complete the steps above first."
                : `Pick a ${televisitDuration}-minute Zoom call slot with our nurse practitioner.`
          }
          action={
            televisitStatus === "todo" && !showPicker
              ? { label: "Choose a time", onClick: () => setShowTelevisitPicker(true) }
              : undefined
          }
        />
      ),
      showPicker ? (
        <AppointmentPicker
          purpose="telehealth_visit"
          durationMinutes={televisitDuration}
          helper={`Pick a ${televisitDuration}-minute Zoom call slot`}
          onBooked={(id, slot) => {
            setTelevisitBooked({ id, scheduled_for: slot.start_at });
            setShowTelevisitPicker(false);
          }}
        />
      ) : null,
    );
  }

  const payLabel = cartRequiresLabs
    ? "Submit for lab review"
    : standaloneTelevisit
      ? "Book & pay"
      : "Pay now";

  pushStep(
    (n) => (
      <Step
        n={n}
        title={cartRequiresLabs ? "Submit for lab review" : standaloneTelevisit ? "Book & pay" : "Payment"}
        status={paymentReady ? (showPayment ? "done" : "todo") : "locked"}
        description={
          paymentReady
            ? showPayment
              ? cartRequiresLabs
                ? "Submitting your order — no charge yet."
                : "Complete the payment form below."
              : cartRequiresLabs
                ? "Your card will NOT be charged now. We only charge after a provider reviews and approves your labs. Labs must be less than 6 months old."
                : standaloneTelevisit
                  ? "Confirm your Zoom call time and pay securely."
                  : "Pay securely to submit your order for provider review."
            : "Complete the steps above first."
        }
        action={
          paymentReady && !showPayment
            ? {
                label: payLabel,
                onClick: () => {
                  if (hasLabInCart && !questAcked) {
                    toast.error("Please acknowledge the Quest Diagnostics notice below first.");
                    return;
                  }
                  setShowPayment(true);
                },
              }
            : undefined
        }
      />
    ),
    hasLabInCart && paymentReady && !showPayment ? (
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
    ) : null,
  );

  const subtitleParts = [
    intakeStatus !== "n/a" ? "intake" : null,
    apptStatus !== "n/a" ? "your appointment" : null,
    consentsStatus !== "n/a" ? "consents" : null,
    televisitStatus !== "n/a" ? "your Zoom call time" : null,
  ].filter(Boolean) as string[];

  return (
    <SiteLayout>
      <PageHero
        eyebrow="checkout"
        title="Complete your order"
        subtitle={
          subtitleParts.length > 0
            ? `Complete ${subtitleParts.join(", ")} before payment.`
            : "Review your order and pay securely."
        }
      />


      <section className="mx-auto max-w-3xl px-6 pb-20 space-y-4">
        {suggestedLabs.length > 0 && !hasLabInCart && (
          <div className="border border-accent/30 bg-accent/5 p-5">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-accent" />
              <h3 className="font-serif text-lg">Required lab panels</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your order requires recent labs (within 6 months). Add a panel below to see your full total, or you may upload existing results later without adding one.
            </p>
            <ul className="mt-3 space-y-2">
              {suggestedLabs.map((lab) => {
                const added = inCartSlugs.has(lab.slug);
                return (
                  <li key={lab.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate">{lab.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatPrice(lab.priceCents)} · {lab.reason}
                      </div>
                    </div>
                    {added ? (
                      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-accent">
                        <Check className="h-3 w-3" /> Added
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addLabToCart(lab)}
                        className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[11px] uppercase tracking-wider hover:bg-secondary"
                      >
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {stepNodes}


        {showPayment && paymentReady && (
          <div className="border border-border p-2 mt-2 bg-card">
            {!cartRequiresLabs && <PaymentTestModeBanner />}
            <StripeEmbeddedCheckoutForm
              items={items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                addSupplies: !!i.addSupplies,
                addBacWater: !!i.addBacWater,
                acknowledged: !!i.acknowledged,
                addTelevisit: !!i.addTelevisit,
              }))}
              returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
              televisitAppointmentId={televisitBooked?.id ?? null}
              couponCode={coupon?.code ?? null}
            />
          </div>
        )}


        <aside className="border border-border p-6 mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Order summary</h2>
            <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {items.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>

          {(() => {
            const isLab = (slug: string) => slug.startsWith("lab-");
            const productItems = items.filter((i) => !isLab(i.slug));
            const labItems = items.filter((i) => isLab(i.slug));

            const lineTotal = (i: typeof items[number]) => {
              const addOns =
                (i.addSupplies ? i.suppliesPriceCents ?? 0 : 0) +
                (i.addBacWater ? i.bacWaterPriceCents ?? 0 : 0) +
                (i.addTelevisit ? i.televisitPriceCents ?? 0 : 0);
              return (i.priceCents + addOns) * i.quantity;
            };

            const renderList = (list: typeof items) => (
              <ul className="divide-y divide-border">
                {list.map((i) => (
                  <li key={i.productId} className="py-3 text-sm">
                    <div className="flex justify-between">
                      <span>
                        {i.name} <span className="text-muted-foreground">× {i.quantity}</span>
                      </span>
                      <span>{formatPrice(lineTotal(i))}</span>
                    </div>
                    {(i.addSupplies || i.addTelevisit || i.addBacWater) && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {i.addSupplies && `+ Supplies kit (${formatPrice(i.suppliesPriceCents ?? 0)})`}
                        {i.addBacWater && ` + Bacteriostatic water (${formatPrice(i.bacWaterPriceCents ?? 0)})`}
                        {i.addSupplies && i.addTelevisit && " · "}
                        {i.addTelevisit && `+ Optional Telehealth Visit (${formatPrice(i.televisitPriceCents ?? 0)})`}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            );

            const productsSubtotal = productItems.reduce((s, i) => s + lineTotal(i), 0);
            const labsSubtotal = labItems.reduce((s, i) => s + lineTotal(i), 0);

            return (
              <>
                {productItems.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-1">Products</div>
                    {renderList(productItems)}
                  </div>
                )}
                {labItems.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-1">Labs</div>
                    {renderList(labItems)}
                  </div>
                )}
                {labItems.length > 0 && (
                  <>
                    <div className="mt-4 flex justify-between text-sm">
                      <span className="text-muted-foreground">Products subtotal</span>
                      <span>{formatPrice(productsSubtotal)}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">Labs subtotal</span>
                      <span>{formatPrice(labsSubtotal)}</span>
                    </div>
                  </>
                )}
                <CouponField
                  items={items.map((i) => ({ productId: i.productId, quantity: i.quantity }))}
                  applied={coupon}
                  onApply={setCoupon}
                />
                {coupon && (
                  <div className="mt-3 flex justify-between text-sm text-accent">
                    <span>Promo {coupon.code}</span>
                    <span>-{formatPrice(coupon.discountCents)}</span>
                  </div>
                )}
                <div className="mt-4 flex justify-between font-serif text-lg border-t border-border pt-4">
                  <span>{cartRequiresLabs ? "Estimated total" : "Subtotal"}</span>
                  <span>{formatPrice(Math.max(0, subtotalCents - (coupon?.discountCents ?? 0)))}</span>
                </div>
                {cartRequiresLabs && (
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    Card is not charged until a provider reviews and approves your labs.
                  </div>
                )}
                {(cartRequiresLabs || hasLabInCart) && (
                  <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                    {LAB_CHARGE_DISCLOSURE}
                  </div>
                )}
              </>
            );
          })()}
        </aside>
      </section>
    </SiteLayout>
  );
}

function Step({
  n,
  title,
  status,
  description,
  action,
}: {
  n: number;
  title: string;
  status: StepStatus;
  description: string;
  action?:
    | { to: string; search: { redirect: string }; label: string }
    | { onClick: () => void; label: string };
}) {
  const icon =
    status === "done" ? (
      <CheckCircle2 className="h-5 w-5 text-accent" />
    ) : status === "locked" ? (
      <Lock className="h-5 w-5 text-muted-foreground" />
    ) : status === "n/a" ? (
      <Circle className="h-5 w-5 text-muted-foreground/40" />
    ) : (
      <Circle className="h-5 w-5 text-foreground" />
    );
  const cls =
    "inline-flex items-center bg-ink text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors";
  return (
    <div
      className={`border p-5 flex items-center gap-5 ${
        status === "done" ? "border-accent/40 bg-accent/5" : "border-border"
      }`}
    >
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground w-8">0{n}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-serif text-lg">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {action && "to" in action && (
        <Link to={action.to} search={action.search} className={cls}>
          {action.label}
        </Link>
      )}
      {action && "onClick" in action && (
        <button type="button" onClick={action.onClick} className={cls}>
          {action.label}
        </button>
      )}
    </div>
  );
}
