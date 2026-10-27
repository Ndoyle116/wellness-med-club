import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Loader2,
  ShieldAlert,
  FlaskConical,
  Stethoscope,
  CalendarClock,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useCart, formatPrice } from "@/lib/cart-context";
import { toast } from "sonner";
import { getFamilyForSlug, type VariantFamily } from "@/lib/product-variants";
import { getProductImage } from "@/lib/product-images";
import {
  ApprovalGate,
  HowToPurchaseIntro,
  type ApprovalStatus,
} from "@/components/ApprovalGate";
import { RefillPanel } from "@/components/RefillPanel";
import { getLabRoute } from "@/lib/lab-routing";
import type { FilterValue } from "@/routes/products.index";
import { getHormoneGender } from "@/lib/hormone-gender";

type Product = Omit<Database["public"]["Tables"]["products"]["Row"], "pharmacy">;

const CATEGORY_LABEL: Record<Product["category"], string> = {
  vitamins: "Vitamins & Supplements",
  peptides: "Peptides & Injectables",
  lab_panel: "Lab Panels",
  hormone_trt: "Hormone Therapies",
  controlled: "Medical Weight Loss",
  dermatology: "Dermatology",
  intimacy: "Intimacy",
  erectile_dysfunction: "Erectile Dysfunction",
  non_fda: "Specialty",
  telehealth_visit: "Zoom Call with Provider",
  bundle: "Bundles",
};

function backFilterFor(p: Pick<Product, "slug" | "name" | "category">): FilterValue {
  if (p.category === "hormone_trt") {
    return getHormoneGender(p.slug, p.name) === "women" ? "hormone_women" : "hormone_men";
  }
  return p.category as FilterValue;
}

function backLabelFor(p: Pick<Product, "slug" | "name" | "category">): string {
  if (p.category === "hormone_trt") {
    return getHormoneGender(p.slug, p.name) === "women"
      ? "Hormone Therapies (Women)"
      : "Hormone Therapies (Men)";
  }
  return CATEGORY_LABEL[p.category];
}

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [addSupplies, setAddSupplies] = useState<boolean | null>(null);
  const [addTelevisit, setAddTelevisit] = useState<boolean | null>(null);
  const [addBacWater, setAddBacWater] = useState<boolean | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>("none");

  const family: VariantFamily | null = getFamilyForSlug(slug);

  const [familyPrices, setFamilyPrices] = useState<Record<string, number>>({});
  const [availableSlugs, setAvailableSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setQty(1);
    setProduct(undefined);
    setAddSupplies(null);
    setAddTelevisit(null);
    setAddBacWater(null);
    setAcknowledged(false);
    supabase
      .from("products")
      .select(
        "id, slug, name, category, description, intended_use, risks, price_cents, requires_labs, requires_consultation, is_controlled, active, image_url, requires_appointment, supplies_available, supplies_price_cents, telehealth_addon_available, telehealth_addon_price_cents, refills_allowed, refill_note, repeat_labs_interval, bac_water_available, bac_water_price_cents, purchase_ack_text, promo_excluded, created_at, updated_at",
      )
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => setProduct(data));
  }, [slug]);

  useEffect(() => {
    if (!family) {
      setFamilyPrices({});
      setAvailableSlugs(new Set());
      return;
    }
    const slugs = family.options.map((o) => o.slug);
    supabase
      .from("products")
      .select("slug, price_cents, active")
      .in("slug", slugs)
      .then(({ data }) => {
        const prices: Record<string, number> = {};
        const avail = new Set<string>();
        for (const row of data ?? []) {
          prices[row.slug] = row.price_cents;
          if (row.active) avail.add(row.slug);
        }
        setFamilyPrices(prices);
        setAvailableSlugs(avail);
      });
  }, [family]);

  if (product === undefined) {
    return (
      <SiteLayout>
        <div className="flex justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  if (product === null) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-6 py-32 text-center">
          <h1 className="font-serif text-3xl">Product not found</h1>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent"
          >
            ← Back to products
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const needsSuppliesChoice = product.supplies_available;
  // If a consultation (or a required appointment) is already part of this product's
  // flow, the optional Zoom-call add-on would double-charge — hide it.
  const needsTelevisitChoice =
    product.telehealth_addon_available &&
    !product.requires_consultation &&
    !product.requires_appointment;
  const needsBacWaterChoice = product.bac_water_available;
  const ackText = product.purchase_ack_text;
  // Lab panels are bought outright — no clinician approval gate.
  const labApprovalRequired = product.requires_labs && product.category !== "lab_panel";

  const addOnsResolved =
    (!needsSuppliesChoice || addSupplies !== null) &&
    (!needsTelevisitChoice || addTelevisit !== null) &&
    (!needsBacWaterChoice || addBacWater !== null);

  const purchaseBlocked =
    (labApprovalRequired && approvalStatus !== "approved") || (!!ackText && !acknowledged);

  const handleAdd = (thenNavigate?: boolean) => {
    if (!addOnsResolved) {
      toast.error("Please choose the add-on options before continuing.");
      return;
    }
    if (ackText && !acknowledged) {
      toast.error("Please confirm the required acknowledgment before continuing.");
      return;
    }
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        priceCents: product.price_cents,
        requiresConsultation: product.requires_consultation,
        requiresLabs: product.requires_labs,
        isControlled: product.is_controlled,
        requiresAppointment: product.requires_appointment ?? false,
        suppliesAvailable: product.supplies_available,
        suppliesPriceCents: product.supplies_price_cents,
        addSupplies: needsSuppliesChoice ? !!addSupplies : false,
        televisitAvailable: needsTelevisitChoice,
        televisitPriceCents: product.telehealth_addon_price_cents,
        addTelevisit: needsTelevisitChoice ? !!addTelevisit : false,
        bacWaterAvailable: product.bac_water_available,
        bacWaterPriceCents: product.bac_water_price_cents,
        addBacWater: needsBacWaterChoice ? !!addBacWater : false,
        purchaseAckText: ackText,
        acknowledged: ackText ? acknowledged : true,
      },
      qty,
    );
    if (thenNavigate) navigate({ to: "/cart" });
    else toast.success(`${product.name} added to cart`);
  };

  const badges: Array<{
    icon: typeof ShieldAlert;
    label: string;
    sub: string;
    highlight?: boolean;
  }> = [];
  if (product.is_controlled)
    badges.push({
      icon: ShieldAlert,
      label: "Controlled Rx",
      sub: "Prescription therapy",
      highlight: true,
    });
  if (product.requires_labs)
    badges.push({ icon: FlaskConical, label: "Labs Required", sub: "Recent bloodwork (≤6 mo)" });
  if (product.requires_consultation)
    badges.push({ icon: Stethoscope, label: "Provider Consult", sub: "15-minute Zoom call" });
  if (product.requires_appointment)
    badges.push({ icon: CalendarClock, label: "Appointment Required", sub: "Book before checkout" });

  const addOnTotalCents =
    (needsSuppliesChoice && addSupplies ? product.supplies_price_cents : 0) +
    (needsTelevisitChoice && addTelevisit ? product.telehealth_addon_price_cents : 0) +
    (needsBacWaterChoice && addBacWater ? product.bac_water_price_cents : 0);
  const lineTotalCents = (product.price_cents + addOnTotalCents) * qty;

  return (
    <SiteLayout>
      <div className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
          {/* Breadcrumb */}
          <nav className="flex text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-8 font-medium">
            <Link
              to="/products"
              search={{ filter: backFilterFor(product) }}
              className="hover:text-accent transition-colors"
            >
              Products
            </Link>
            <span className="mx-3">/</span>
            <Link
              to="/products"
              search={{ filter: backFilterFor(product) }}
              className="hover:text-accent transition-colors"
            >
              {backLabelFor(product)}
            </Link>
            <span className="mx-3">/</span>
            <span className="text-foreground truncate">{product.name}</span>
          </nav>

          {/* Classic PDP: gallery left, buy box right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Gallery */}
            <div className="lg:col-span-6">
              <div className="lg:sticky lg:top-24">
                <div className="relative aspect-square bg-cream border border-border overflow-hidden">
                  {getProductImage(product.slug) ? (
                    <img
                      src={getProductImage(product.slug)}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-center px-8">
                      <div>
                        <span className="block divider-script text-2xl text-accent mb-3">
                          Wellness Med Club
                        </span>
                        <h2 className="font-serif italic text-2xl leading-tight text-foreground">
                          {product.name}
                        </h2>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-6 left-6">
                    <div className="bg-background/90 backdrop-blur-sm px-3 py-1 border border-accent/20 rounded-full">
                      <span className="text-[10px] tracking-widest uppercase font-semibold text-accent">
                        {product.is_controlled ? "Rx · Medical Grade" : "Practitioner Curated"}
                      </span>
                    </div>
                  </div>
                </div>

                {badges.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {badges.map((b) => {
                      const Icon = b.icon;
                      return (
                        <div
                          key={b.label}
                          className={`flex items-center gap-3 p-3 border rounded-sm bg-card ${
                            b.highlight ? "border-accent/40 bg-accent/5" : "border-border"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              b.highlight ? "bg-accent/15" : "border border-accent/30"
                            }`}
                          >
                            <Icon className="h-4 w-4 text-accent" />
                          </div>
                          <div className="flex flex-col leading-tight">
                            <span
                              className={`text-[10px] uppercase font-bold tracking-tight ${
                                b.highlight ? "text-accent" : "text-foreground"
                              }`}
                            >
                              {b.label}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{b.sub}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {labApprovalRequired && (
                  <div className="mt-4 border border-accent/40 bg-accent/5 p-5">
                    <HowToPurchaseIntro
                      productId={product.id}
                      telehealthRequired={Boolean(
                        getLabRoute(product.slug, product.name, product.category)
                          ?.telehealthRequired,
                      )}
                      intro="This medication requires a clinician-approved lab review before purchase."
                    />
                  </div>
                )}
              </div>
            </div>


            {/* Buy box */}
            <div className="lg:col-span-6">
              <div className="text-[10px] uppercase tracking-[0.28em] text-accent font-semibold mb-3">
                {CATEGORY_LABEL[product.category]}
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-normal leading-tight text-foreground">
                {product.name}
              </h1>
              <div className="mt-4 flex items-baseline gap-3 pb-6 border-b border-border">
                <span className="text-2xl font-light text-foreground">
                  {formatPrice(product.price_cents)}
                </span>
                {product.category === "telehealth_visit" && (
                  <span className="text-xs tracking-wider text-muted-foreground uppercase">
                    / per visit
                  </span>
                )}
                {product.category === "lab_panel" && (
                  <span className="text-xs tracking-wider text-muted-foreground uppercase">
                    / requisition
                  </span>
                )}
              </div>

              {product.description && (
                <p className="mt-6 text-sm font-light leading-relaxed text-foreground/80 whitespace-pre-line">
                  {product.description}
                </p>
              )}

              {/* Variant selector */}
              {family && (
                <div className="mt-8">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-foreground font-semibold mb-3">
                    {family.axisLabel}
                  </div>
                  <div
                    role="radiogroup"
                    aria-label={`${family.title} ${family.axisLabel}`}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                  >
                    {family.options.map((opt) => {
                      const isSelected = opt.slug === slug;
                      const isAvailable = availableSlugs.size === 0 || availableSlugs.has(opt.slug);
                      const price = familyPrices[opt.slug];
                      return (
                        <button
                          key={opt.slug}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={!isAvailable}
                          onClick={() => {
                            if (!isSelected && isAvailable) {
                              navigate({ to: "/products/$slug", params: { slug: opt.slug } });
                            }
                          }}
                          className={`text-left p-3 border rounded-sm transition-colors ${
                            isSelected
                              ? "border-accent bg-accent/10"
                              : isAvailable
                                ? "border-border bg-card hover:border-accent/60"
                                : "border-border bg-muted/40 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <span
                              className={`text-xs font-semibold ${
                                isSelected ? "text-accent" : "text-foreground"
                              }`}
                            >
                              {opt.label}
                            </span>
                            {price != null && (
                              <span className="text-xs font-light text-foreground/80 shrink-0">
                                {formatPrice(price)}
                              </span>
                            )}
                          </div>
                          {opt.sublabel && (
                            <div className="text-[11px] text-muted-foreground mt-1">
                              {opt.sublabel}
                            </div>
                          )}
                          {!isAvailable && (
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                              Unavailable
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Refills — eligible testosterone / phentermine reorders */}
              <div className="mt-8">
                <RefillPanel productId={product.id} />
              </div>

              {/* Lab approval */}
              {labApprovalRequired && (
                <div className="mt-8 border border-border p-5 bg-card">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-accent font-semibold mb-4">
                    Lab approval required
                  </div>
                  <ApprovalGate
                    productId={product.id}
                    productSlug={product.slug}
                    productName={product.name}
                    productCategory={product.category}
                    onStatusChange={setApprovalStatus}
                  />
                </div>
              )}

              {/* Acknowledgment */}
              {ackText && (
                <label className="mt-8 flex items-start gap-3 border border-accent/40 bg-accent/5 p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                  />
                  <span className="text-xs leading-relaxed text-foreground">
                    <span className="block text-[10px] uppercase tracking-[0.22em] text-accent font-semibold mb-1">
                      Required acknowledgment
                    </span>
                    {ackText}
                  </span>
                </label>
              )}

              {/* Add-ons */}
              {(needsSuppliesChoice || needsBacWaterChoice || needsTelevisitChoice) && (
                <div className="mt-8 space-y-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-foreground font-semibold">
                    Add-ons
                  </div>
                  {needsSuppliesChoice && (
                    <AddOnChoice
                      title="Injection supplies kit"
                      priceCents={product.supplies_price_cents}
                      helper="Alcohol swabs and needles matched to this pharmacy."
                      yesLabel="Add supplies"
                      noLabel="I already have supplies"
                      value={addSupplies}
                      onChange={setAddSupplies}
                    />
                  )}
                  {needsBacWaterChoice && (
                    <AddOnChoice
                      title="Bacteriostatic water (30 mL)"
                      priceCents={product.bac_water_price_cents}
                      helper="Required to reconstitute lyophilized powder. Skip if you already have a sterile vial."
                      yesLabel="Add bacteriostatic water"
                      noLabel="I already have it"
                      value={addBacWater}
                      onChange={setAddBacWater}
                    />
                  )}
                  {needsTelevisitChoice && (
                    <AddOnChoice
                      title="Optional Telehealth Visit"
                      priceCents={product.telehealth_addon_price_cents}
                      helper={
                        product.category === "lab_panel"
                          ? "Optional 15-minute telehealth visit with our nurse practitioner to review these results. Not required to order this panel."
                          : "15-minute Zoom call with our nurse practitioner. Recommended if you have questions."
                      }
                      yesLabel="Add telehealth visit"
                      noLabel="No thanks"
                      value={addTelevisit}
                      onChange={setAddTelevisit}
                    />
                  )}
                </div>
              )}

              {/* Quantity + purchase */}
              <div className="mt-8">
                <div className="flex items-stretch h-14">
                  <div className="flex border border-border">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-5 hover:bg-cream transition-colors"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <div className="w-14 flex items-center justify-center border-x border-border text-sm font-medium">
                      {qty}
                    </div>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="px-5 hover:bg-cream transition-colors"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-end px-5 border-y border-r border-border">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-3">
                      Total
                    </span>
                    <span className="text-lg font-light">{formatPrice(lineTotalCents)}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <button
                    onClick={() => handleAdd(true)}
                    disabled={purchaseBlocked}
                    className="h-14 bg-ink text-primary-foreground text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors duration-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ink"
                  >
                    {purchaseBlocked ? "Approval required" : "Buy now"}
                  </button>
                  <button
                    onClick={() => handleAdd(false)}
                    disabled={purchaseBlocked}
                    className="h-12 border border-foreground text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground"
                  >
                    Add to cart
                  </button>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <CheckCircle2 className="h-3 w-3 text-accent" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                      Available for Florida &amp; Nevada residents
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details below the fold */}
          <section className="mt-16 border-t border-border pt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              {product.intended_use && (
                <FieldBlock label="Intended Use">{product.intended_use}</FieldBlock>
              )}
              {(product.refills_allowed !== null || product.repeat_labs_interval) && (
                <div className="border-t border-border pt-5 grid sm:grid-cols-2 gap-5">
                  {(product.refills_allowed !== null || product.refill_note) && (
                    <FieldBlock label="Refills">
                      {product.refills_allowed !== null
                        ? `${product.refills_allowed}${product.refill_note ? ` — ${product.refill_note}` : ""}`
                        : (product.refill_note ?? "")}
                    </FieldBlock>
                  )}
                  {product.repeat_labs_interval && (
                    <FieldBlock label="Repeat Labs">{product.repeat_labs_interval}</FieldBlock>
                  )}
                </div>
              )}
              {product.risks && (
                <details className="group border-t border-border pt-5">
                  <summary className="list-none flex justify-between items-center cursor-pointer">
                    <span className="text-xs uppercase tracking-widest font-semibold text-foreground">
                      Safety &amp; Side Effects
                    </span>
                    <Plus className="h-4 w-4 text-accent transition-transform duration-300 group-open:rotate-45" />
                  </summary>
                  <p className="pt-4 text-sm font-light leading-relaxed text-foreground/70 whitespace-pre-line">
                    {product.risks}
                  </p>
                </details>
              )}
            </div>
            <div className="lg:col-span-4">
              <Link
                to="/products"
                search={{ filter: backFilterFor(product) }}
                className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-accent transition-colors"
              >
                ← Back to {backLabelFor(product)}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2 font-semibold">
        {label}
      </div>
      <p className="text-sm font-light leading-relaxed text-foreground/70 whitespace-pre-line">
        {children}
      </p>
    </div>
  );
}

function AddOnChoice({
  title,
  priceCents,
  helper,
  yesLabel,
  noLabel,
  value,
  onChange,
}: {
  title: string;
  priceCents: number;
  helper: string;
  yesLabel: string;
  noLabel: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="border border-border p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-xs uppercase tracking-[0.22em] font-semibold text-foreground">
          {title}
        </div>
        <div className="text-sm font-light text-foreground">+{formatPrice(priceCents)}</div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">{helper}</p>
      <div role="radiogroup" className="grid grid-cols-2 gap-2 mt-3">
        <button
          type="button"
          role="radio"
          aria-checked={value === true}
          onClick={() => onChange(true)}
          className={`text-left px-3 py-2 text-xs border transition-colors ${
            value === true
              ? "border-accent bg-accent/10 text-accent font-semibold"
              : "border-border hover:border-accent"
          }`}
        >
          {yesLabel}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === false}
          onClick={() => onChange(false)}
          className={`text-left px-3 py-2 text-xs border transition-colors ${
            value === false
              ? "border-accent bg-accent/10 text-accent font-semibold"
              : "border-border hover:border-accent"
          }`}
        >
          {noLabel}
        </button>
      </div>
      {value === null && (
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
          Please choose an option
        </div>
      )}
    </div>
  );
}
