import type { CartItem } from "@/lib/cart-context";
import { supabase } from "@/integrations/supabase/client";

export type ConsentRequirement = {
  slug: string;
  title: string;
  body: string;
  version: number;
  scope: "always_required" | "per_product";
};

/**
 * Consents a patient must sign before completing an order for these cart items.
 * Combines:
 *   - Every currently-active `always_required` consent (waiver, practice policies).
 *   - Every `per_product` consent linked to any product in the cart via
 *     `product_consents`.
 *
 * Query runs against the browser client (RLS lets anyone read active
 * consent_templates + product_consents).
 */
export async function fetchRequiredConsentsForCart(
  items: CartItem[],
): Promise<ConsentRequirement[]> {
  const consentItems = items.filter((item) => item.category !== "telehealth_visit");
  if (consentItems.length === 0) return [];

  // A standalone lab-panel purchase only requires the Laboratory Order Consent.
  const labOnly = consentItems.every((item) => item.category === "lab_panel");

  const [{ data: alwaysRows }, perProductRows] = await Promise.all([
    labOnly
      ? Promise.resolve({ data: [] as Array<ConsentRequirement> })
      : supabase
          .from("consent_templates")
          .select("slug, title, body, version, scope")
          .eq("active", true)
          .eq("scope", "always_required"),
    fetchPerProductConsents(consentItems),
  ]);

  const map = new Map<string, ConsentRequirement>();
  for (const row of alwaysRows ?? []) {
    map.set(row.slug, {
      slug: row.slug,
      title: row.title,
      body: row.body,
      version: row.version,
      scope: "always_required",
    });
  }
  for (const row of perProductRows) {
    if (!map.has(row.slug)) map.set(row.slug, row);
  }
  return Array.from(map.values());
}

async function fetchPerProductConsents(items: CartItem[]): Promise<ConsentRequirement[]> {
  if (items.length === 0) return [];
  const productIds = items.map((i) => i.productId);
  const { data } = await supabase
    .from("product_consents")
    .select("consent_slug, consent_templates!inner(slug, title, body, version, scope, active)")
    .in("product_id", productIds);
  const out: ConsentRequirement[] = [];
  const seen = new Set<string>();
  for (const row of (data ?? []) as Array<{
    consent_slug: string;
    consent_templates: {
      slug: string;
      title: string;
      body: string;
      version: number;
      scope: "always_required" | "per_product";
      active: boolean;
    };
  }>) {
    const t = row.consent_templates;
    if (!t?.active) continue;
    if (seen.has(t.slug)) continue;
    seen.add(t.slug);
    out.push({
      slug: t.slug,
      title: t.title,
      body: t.body,
      version: t.version,
      scope: t.scope,
    });
  }
  return out;
}

export function cartRequiresIntake(items: CartItem[]): boolean {
  return items.some(
    (i) =>
      i.category !== "telehealth_visit" &&
      i.category !== "lab_panel" &&
      (i.requiresConsultation || i.requiresLabs || i.isControlled || i.category !== "vitamins"),
  );
}

export function cartRequiresLabs(items: CartItem[]): boolean {
  return items.some((i) => i.requiresLabs && i.category !== "lab_panel");
}

export function cartRequiresConsultation(items: CartItem[]): boolean {
  return items.some((i) => i.requiresConsultation);
}

/**
 * Products in the cart that need a pre-purchase appointment booking.
 * Populated from the `requires_appointment` product flag which is now stored
 * on the CartItem for convenience.
 */
export function cartAppointmentProductIds(items: CartItem[]): string[] {
  return items.filter((i) => i.requiresAppointment).map((i) => i.productId);
}

/**
 * Same requirement set as the cart, but resolved straight from product ids.
 * Used by flows that charge outside the cart (e.g. the inline lab-panel
 * payment), so the consent page can show exactly what the server will enforce.
 */
export async function fetchRequiredConsentsForProductIds(
  productIds: string[],
): Promise<ConsentRequirement[]> {
  const ids = Array.from(new Set(productIds.filter(Boolean)));
  if (ids.length === 0) return [];
  const { data: products } = await supabase
    .from("products")
    .select("id, category, requires_labs, requires_consultation, is_controlled")
    .in("id", ids);
  const items = (products ?? []).map((p) => ({
    productId: p.id,
    category: p.category,
    requiresLabs: p.requires_labs,
    requiresConsultation: p.requires_consultation,
    isControlled: p.is_controlled,
  })) as unknown as CartItem[];
  if (items.length === 0) return [];
  return fetchRequiredConsentsForCart(items);
}
