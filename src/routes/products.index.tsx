import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Pill, Syringe, FlaskConical, Leaf, ShieldAlert, Loader2, Sparkles, Video, Droplet, Heart, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getFamilyForSlug } from "@/lib/product-variants";
import { getHormoneGenders } from "@/lib/hormone-gender";


type Product = Omit<Database["public"]["Tables"]["products"]["Row"], "pharmacy">;
type Category = Database["public"]["Enums"]["product_category"];
type FilterId = Category | "all" | "hormone_men" | "hormone_women";
type CardEntry =
  | { kind: "single"; product: Product }
  | { kind: "family"; familyId: string; familyTitle: string; category: Category; products: Product[] };

const VALID_FILTERS = ["all", "lab_panel", "vitamins", "peptides", "hormone_men", "hormone_women", "controlled", "dermatology", "intimacy", "erectile_dysfunction", "telehealth_visit", "bundle", "non_fda"] as const;
export type FilterValue = (typeof VALID_FILTERS)[number];

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): { filter?: FilterValue } => {
    const f = search.filter;
    if (typeof f === "string" && (VALID_FILTERS as readonly string[]).includes(f)) {
      return { filter: f as FilterValue };
    }
    return {};
  },
  head: () => ({
    meta: [
      { title: "Products — Wellness Med Club" },
      { name: "description", content: "Browse vitamins, peptides, lab panels, and hormone therapies. Each order includes intake screening and product-specific consents." },
      { property: "og:title", content: "Products — Wellness Med Club" },
      { property: "og:description", content: "Vitamins, peptides, lab panels, and prescription therapies." },
    ],
  }),
  component: ProductsPage,
});

const CATEGORY_META: Record<Category, { label: string; icon: typeof Pill; blurb: string }> = {
  vitamins: { label: "Vitamins & Supplements", icon: Pill, blurb: "Foundational nutrients and everyday supports." },
  peptides: { label: "Peptides & Injectables", icon: Syringe, blurb: "Targeted peptide therapies." },
  lab_panel: { label: "Lab Panels", icon: FlaskConical, blurb: "Quest Diagnostics requisitions." },
  hormone_trt: { label: "Hormone Therapies", icon: Leaf, blurb: "TRT, HRT, and optimization." },
  controlled: { label: "Medical Weight Loss", icon: ShieldAlert, blurb: "GLP-1 and prescription therapies." },
  dermatology: { label: "Dermatology", icon: Droplet, blurb: "Skin and hair restoration." },
  intimacy: { label: "Intimacy", icon: Heart, blurb: "Intimate wellness formulations." },
  erectile_dysfunction: { label: "Erectile Dysfunction", icon: Activity, blurb: "Prescription ED treatment options." },
  non_fda: { label: "Specialty", icon: Sparkles, blurb: "Specialty formulations." },
  telehealth_visit: { label: "Zoom Call with Provider", icon: Video, blurb: "One-on-one Zoom calls with our medical practitioner." },
  bundle: { label: "Bundles", icon: Sparkles, blurb: "Curated multi-product programs at a package price." },
};

const FILTER_LABEL: Record<Exclude<FilterId, "all">, string> = {
  ...Object.fromEntries(
    (Object.keys(CATEGORY_META) as Category[]).map((k) => [k, CATEGORY_META[k].label]),
  ) as Record<Category, string>,
  hormone_men: "Hormone Therapies (Men)",
  hormone_women: "Hormone Therapies (Women)",
};

const FILTERS: FilterId[] = ["all", "lab_panel", "vitamins", "peptides", "hormone_men", "hormone_women", "controlled", "dermatology", "intimacy", "bundle", "erectile_dysfunction", "telehealth_visit"];

// Bundles are numbered (#1 … #12) and must always read in ascending numeric order.
function bundleNumber(name: string): number {
  const m = name.match(/#(\d+)/);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}

function sortCatalog(list: Product[]): Product[] {
  return [...list].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.category === "bundle") return bundleNumber(a.name) - bundleNumber(b.name);
    return a.price_cents - b.price_cents;
  });
}




function ProductsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [products, setProducts] = useState<Product[] | null>(null);
  const filter: FilterId = search.filter ?? "all";
  const setFilter = (f: FilterId) => {
    navigate({ search: f === "all" ? {} : { filter: f as FilterValue }, replace: true });
  };


  useEffect(() => {
    supabase
      .from("products")
      .select(
        "id, slug, name, category, description, intended_use, risks, price_cents, requires_labs, requires_consultation, is_controlled, active, image_url, requires_appointment, supplies_available, supplies_price_cents, telehealth_addon_available, telehealth_addon_price_cents, refills_allowed, refill_note, repeat_labs_interval, bac_water_available, bac_water_price_cents, purchase_ack_text, promo_excluded, created_at, updated_at",
      )
      .eq("active", true)
      .order("category")
      .order("price_cents")
      .then(({ data }) => setProducts(sortCatalog(data ?? [])));
  }, []);


  const filtered = useMemo(() => {
    if (!products) return null;
    if (filter === "all") return products;
    if (filter === "hormone_men" || filter === "hormone_women") {
      const gender = filter === "hormone_men" ? "men" : "women";
      return products.filter((p) => p.category === "hormone_trt" && getHormoneGenders(p.slug, p.name).includes(gender));
    }
    return products.filter((p) => p.category === filter);
  }, [products, filter]);

  const entries = useMemo<CardEntry[] | null>(() => {
    if (!filtered) return null;
    const result: CardEntry[] = [];
    const familyIndex = new Map<string, number>();
    for (const p of filtered) {
      const fam = getFamilyForSlug(p.slug);
      if (!fam) {
        result.push({ kind: "single", product: p });
        continue;
      }
      const idx = familyIndex.get(fam.id);
      if (idx === undefined) {
        familyIndex.set(fam.id, result.length);
        result.push({ kind: "family", familyId: fam.id, familyTitle: fam.title, category: p.category, products: [p] });
      } else {
        (result[idx] as Extract<CardEntry, { kind: "family" }>).products.push(p);
      }
    }
    return result;
  }, [filtered]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="our offerings"
        title="Curated wellness, clinician-reviewed."
        subtitle="Every product includes the right intake forms, consents, and clinical review for your safety. Available to residents of Florida and Nevada."
      />


      <section className="mx-auto max-w-7xl px-6 pt-12">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border transition-colors ${
                filter === f
                  ? "bg-ink text-primary-foreground border-ink"
                  : "bg-background border-border hover:border-accent hover:text-accent"
              }`}
            >
              {f === "all" ? "All" : FILTER_LABEL[f]}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {!entries ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center py-20 text-muted-foreground">No products in this category yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry) => {
              if (entry.kind === "family") {
                const meta = CATEGORY_META[entry.category];
                const Icon = meta.icon;
                const firstSlug = entry.products[0].slug;
                const anyConsult = entry.products.some((p) => p.requires_consultation);
                const anyLabs = entry.products.some((p) => p.requires_labs);
                const anyRx = entry.products.some((p) => p.is_controlled);
                return (
                  <article key={`fam-${entry.familyId}`} className="bg-background border border-border p-6 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <Icon className="h-6 w-6 text-accent" />
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {meta.label}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl leading-tight">{entry.familyTitle}</h3>
                    <p className="mt-2 text-sm text-muted-foreground flex-1">
                      {entry.products.length} options available — choose strength, volume, or quantity on the product page.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {anyConsult && <span className="text-[10px] uppercase tracking-wider bg-secondary px-2 py-1">Consult</span>}
                      {anyLabs && <span className="text-[10px] uppercase tracking-wider bg-secondary px-2 py-1">Labs</span>}
                      {anyRx && <span className="text-[10px] uppercase tracking-wider bg-accent/10 text-accent px-2 py-1">Rx</span>}
                    </div>
                    <div className="mt-6 pt-4 border-t border-border">
                      <Link
                        to="/products/$slug"
                        params={{ slug: firstSlug }}
                        className="w-full inline-flex justify-center bg-ink text-primary-foreground px-3 py-2 text-xs uppercase tracking-[0.2em] hover:bg-accent transition-colors"
                      >
                        View details
                      </Link>
                    </div>
                  </article>
                );
              }
              const p = entry.product;
              const meta = CATEGORY_META[p.category];
              const Icon = meta.icon;
              return (
                <article key={p.id} className="bg-background border border-border p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="h-6 w-6 text-accent" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {meta.label}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl leading-tight">{p.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">
                    {p.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.requires_consultation && (
                      <span className="text-[10px] uppercase tracking-wider bg-secondary px-2 py-1">Consult</span>
                    )}
                    {p.requires_labs && (
                      <span className="text-[10px] uppercase tracking-wider bg-secondary px-2 py-1">Labs</span>
                    )}
                    {p.is_controlled && (
                      <span className="text-[10px] uppercase tracking-wider bg-accent/10 text-accent px-2 py-1">Rx</span>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-border">
                    <Link
                      to="/products/$slug"
                      params={{ slug: p.slug }}
                      className="w-full inline-flex justify-center bg-ink text-primary-foreground px-3 py-2 text-xs uppercase tracking-[0.2em] hover:bg-accent transition-colors"
                    >
                      View details
                    </Link>
                  </div>
                </article>
              );
            })}

          </div>
        )}
      </section>


      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-6 py-16 grid lg:grid-cols-2 gap-8">
          <div className="bg-background border border-accent/30 p-6 flex gap-3">
            <ShieldAlert className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif text-lg">Lab orders ship within 24 business hours</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Requisitions are sent to your email for use at any Quest Diagnostics location in FL or NV.
                Friday afternoon orders may process the following Monday.
              </p>
            </div>
          </div>
          <div className="bg-background border border-accent/30 p-6 flex gap-3">
            <Leaf className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif text-lg">Hormone & controlled therapies</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Require recent labs (≤6 months) and a 15-minute consultation. Orders remain pending until
                clinical appropriateness is confirmed.{" "}
                <Link to="/how-it-works" className="underline hover:text-accent">See workflow</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
