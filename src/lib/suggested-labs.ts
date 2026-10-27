import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/lib/cart-context";

export type SuggestedLab = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  reason: string;
};

type Rule = { match: (slug: string) => boolean; labSlugs: string[]; reason: string };

// Slug-based mapping. When sex-specific, include both male + female panels
// (patient sex isn't always known at cart time).
const RULES: Rule[] = [
  {
    match: (s) =>
      s === "bundle-menopause-starter" ||
      s === "bundle-estradiol-progesterone" ||
      s === "bundle-womens-hrt",
    labSlugs: ["lab-womens-hrt-monitoring"],
    reason: "HRT blood work required for this bundle.",
  },
  {
    match: (s) => s === "bundle-mens-trt-starter",
    labSlugs: ["lab-male-trt-monitoring"],
    reason: "TRT blood work required for this bundle.",
  },
  {
    match: (s) => s.startsWith("hrm-testosterone-") && s.includes("women"),

    labSlugs: ["lab-womens-hrt-monitoring"],
    reason: "Required for Testosterone (women).",
  },
  {
    match: (s) => s.startsWith("hrm-testosterone-"),
    labSlugs: ["lab-male-trt-monitoring"],
    reason: "Required for Testosterone therapy.",
  },
  {
    match: (s) => s.startsWith("hrm-estrogen-") || s.startsWith("hrm-progesterone"),
    labSlugs: ["lab-female-hormone-panel"],
    reason: "Required for HRT (estrogen/progesterone).",
  },
  {
    match: (s) => s.startsWith("ctrl-phen"),
    labSlugs: ["lab-phentermine-male", "lab-phentermine-female"],
    reason: "Required for Phentermine.",
  },
  {
    match: (s) => s.startsWith("glp-"),
    labSlugs: ["lab-glp1-male", "lab-glp1-female"],
    reason: "Required for GLP-1 therapy.",
  },
  {
    match: (s) => s.startsWith("vit-b12-"),
    labSlugs: ["lab-b12-addon"],
    reason: "Baseline B12 level required.",
  },
  {
    match: (s) => s.startsWith("vit-d3-"),
    labSlugs: ["lab-vitamin-d-addon"],
    reason: "Baseline Vitamin D level required.",
  },
];

export function getSuggestedLabItems(
  items: CartItem[],
  approvedManualProductIds: ReadonlySet<string> = new Set(),
): CartItem[] {
  return items.filter(
    (item) => item.requiresLabs && !approvedManualProductIds.has(item.productId),
  );
}

export async function getSuggestedLabPanels(
  items: CartItem[],
  approvedManualProductIds: ReadonlySet<string> = new Set(),
): Promise<SuggestedLab[]> {
  const labItems = getSuggestedLabItems(items, approvedManualProductIds);
  if (labItems.length === 0) return [];

  const wanted = new Map<string, string>(); // slug -> reason
  for (const item of labItems) {
    for (const rule of RULES) {
      if (rule.match(item.slug)) {
        for (const labSlug of rule.labSlugs) {
          if (!wanted.has(labSlug)) wanted.set(labSlug, rule.reason);
        }
      }
    }
  }
  if (wanted.size === 0) return [];

  const { data } = await supabase
    .from("products")
    .select("id, slug, name, price_cents")
    .in("slug", Array.from(wanted.keys()))
    .eq("active", true);

  return (data ?? [])
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      priceCents: p.price_cents,
      reason: wanted.get(p.slug) ?? "Required lab work.",
    }))
    .sort((a, b) => a.priceCents - b.priceCents);
}

export function isLabPanelSlug(slug: string): boolean {
  return slug.startsWith("lab-");
}
