/**
 * Pure helpers for the consent-verification portion of checkout.
 * Extracted from `checkout.functions.ts` so it can be unit-tested without a
 * live Supabase context.
 */

export type TemplateRow = {
  id: string;
  slug: string;
  version: number;
  active: boolean;
  scope: "always_required" | "per_product";
};

export type SignatureRow = {
  consent_template_id: string;
  template_version: number;
};

export type RequiredTemplate = { id: string; slug: string; version: number };

/**
 * Merge per-product templates (from product_consents join) with always_required
 * templates. Inactive templates are dropped. Deduplicated by slug.
 */
export function collectRequiredTemplates(
  perProduct: Array<{ consent_templates: TemplateRow | null }>,
  alwaysRequired: Array<Pick<TemplateRow, "id" | "slug" | "version">>,
): Map<string, RequiredTemplate> {
  const out = new Map<string, RequiredTemplate>();
  for (const row of perProduct) {
    const t = row.consent_templates;
    if (!t?.active) continue;
    out.set(t.slug, { id: t.id, slug: t.slug, version: t.version });
  }
  for (const t of alwaysRequired) out.set(t.slug, t);
  return out;
}

/**
 * Returns the slugs of required templates the user has NOT signed at the
 * current version. Empty array = all consents satisfied.
 */
export function missingConsentSlugs(
  required: Map<string, RequiredTemplate>,
  signatures: SignatureRow[],
): string[] {
  const requiredList = Array.from(required.values());
  const okIds = new Set(
    signatures
      .filter((s) =>
        requiredList.some(
          (t) => t.id === s.consent_template_id && t.version === s.template_version,
        ),
      )
      .map((s) => s.consent_template_id),
  );
  return requiredList.filter((t) => !okIds.has(t.id)).map((t) => t.slug);
}
