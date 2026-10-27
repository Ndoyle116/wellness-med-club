import { describe, it, expect } from "vitest";
import {
  collectRequiredTemplates,
  missingConsentSlugs,
  type TemplateRow,
  type SignatureRow,
} from "./consent-verification";

// Peptide product consent set (mirrors production DB after activation).
const PEPTIDE_GENERAL: TemplateRow = {
  id: "tpl-peptide-general",
  slug: "peptide-therapy-general",
  version: 1,
  active: true,
  scope: "per_product",
};
const NON_FDA: TemplateRow = {
  id: "tpl-non-fda",
  slug: "non-fda-consent",
  version: 1,
  active: true,
  scope: "per_product",
};
const WAIVER = {
  id: "tpl-waiver",
  slug: "waiver-of-liability",
  version: 2,
};
const PRACTICE = {
  id: "tpl-practice",
  slug: "practice-policies",
  version: 1,
};

// perProduct rows as returned by the product_consents!inner join
const peptideProductConsents = [
  { consent_templates: NON_FDA },
  { consent_templates: PEPTIDE_GENERAL },
];
const alwaysRequired = [WAIVER, PRACTICE];

function collect() {
  return collectRequiredTemplates(peptideProductConsents, alwaysRequired);
}

describe("peptide checkout consent enforcement", () => {
  it("requires peptide-therapy-general when template is active", () => {
    const required = collect();
    expect(required.has("peptide-therapy-general")).toBe(true);
    expect(required.get("peptide-therapy-general")).toMatchObject({
      id: "tpl-peptide-general",
      version: 1,
    });
  });

  it("BLOCKS: missing peptide-therapy-general signature entirely", () => {
    const required = collect();
    const sigs: SignatureRow[] = [
      { consent_template_id: NON_FDA.id, template_version: 1 },
      { consent_template_id: WAIVER.id, template_version: 2 },
      { consent_template_id: PRACTICE.id, template_version: 1 },
      // no peptide-therapy-general signature
    ];
    const missing = missingConsentSlugs(required, sigs);
    expect(missing).toContain("peptide-therapy-general");
    expect(missing.length).toBeGreaterThan(0);
  });

  it("BLOCKS: peptide-therapy-general signed at wrong (older) version", () => {
    const required = collect();
    const sigs: SignatureRow[] = [
      { consent_template_id: NON_FDA.id, template_version: 1 },
      { consent_template_id: WAIVER.id, template_version: 2 },
      { consent_template_id: PRACTICE.id, template_version: 1 },
      { consent_template_id: PEPTIDE_GENERAL.id, template_version: 0 }, // stale
    ];
    const missing = missingConsentSlugs(required, sigs);
    expect(missing).toEqual(["peptide-therapy-general"]);
  });

  it("BLOCKS: peptide-therapy-general signed at wrong (newer) version", () => {
    const required = collect();
    const sigs: SignatureRow[] = [
      { consent_template_id: NON_FDA.id, template_version: 1 },
      { consent_template_id: WAIVER.id, template_version: 2 },
      { consent_template_id: PRACTICE.id, template_version: 1 },
      { consent_template_id: PEPTIDE_GENERAL.id, template_version: 2 },
    ];
    const missing = missingConsentSlugs(required, sigs);
    expect(missing).toEqual(["peptide-therapy-general"]);
  });

  it("BLOCKS: no signatures at all", () => {
    const required = collect();
    const missing = missingConsentSlugs(required, []);
    expect(missing.sort()).toEqual(
      [
        "non-fda-consent",
        "peptide-therapy-general",
        "practice-policies",
        "waiver-of-liability",
      ].sort(),
    );
  });

  it("PASSES: all four required consents signed at current version", () => {
    const required = collect();
    const sigs: SignatureRow[] = [
      { consent_template_id: NON_FDA.id, template_version: 1 },
      { consent_template_id: PEPTIDE_GENERAL.id, template_version: 1 },
      { consent_template_id: WAIVER.id, template_version: 2 },
      { consent_template_id: PRACTICE.id, template_version: 1 },
    ];
    expect(missingConsentSlugs(required, sigs)).toEqual([]);
  });

  it("SAFETY: inactive peptide-therapy-general template drops out (would not block)", () => {
    // Guard against regression to the previous state where the template was inactive.
    const required = collectRequiredTemplates(
      [
        { consent_templates: NON_FDA },
        { consent_templates: { ...PEPTIDE_GENERAL, active: false } },
      ],
      alwaysRequired,
    );
    expect(required.has("peptide-therapy-general")).toBe(false);
  });
});
