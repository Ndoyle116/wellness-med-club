// Strict variant families as defined in the Wellness Med Club master menu PDF.
// Each family groups the ONLY allowed variations for a given product line.
// The order here is the order shown to the customer.

export type VariantOption = {
  slug: string;
  label: string; // short, e.g. "8 mg/mL · 1 mL"
  sublabel?: string; // e.g. "25 units weekly"
};

export type VariantFamily = {
  id: string;
  title: string; // customer-facing product line name
  axisLabel: string; // e.g. "Strength & Volume", "Quantity"
  options: VariantOption[];
};

export const VARIANT_FAMILIES: VariantFamily[] = [
  {
    id: "nad-injection",
    title: "NAD+ Injection",
    axisLabel: "Strength, Volume & Quantity",
    options: [
      { slug: "inj-nad-200-5ml", label: "200 mg/mL · 5 mL", sublabel: "Single vial" },
      { slug: "inj-nad-100-10ml", label: "100 mg/mL · 10 mL", sublabel: "Single vial · supplies sold separately" },
      { slug: "inj-nad-200-5ml-2pk", label: "2 vials · 200 mg/mL · 5 mL each", sublabel: "Bundled price" },
      { slug: "inj-nad-100-10ml-2pk", label: "2 vials · 100 mg/mL · 10 mL each", sublabel: "Bundled price" },
    ],
  },

  {
    id: "sermorelin",
    title: "Sermorelin",
    axisLabel: "Form & Strength",
    options: [
      { slug: "pep-sermorelin-09-10ml", label: "1 mg/mL · 10 mL", sublabel: "Already reconstituted · supplies sold separately" },
      { slug: "pep-sermorelin-lyo-6mg", label: "6 mg lyophilized powder", sublabel: "Not reconstituted · bacteriostatic water optional" },
      { slug: "pep-sermorelin-lyo-15mg", label: "15 mg lyophilized powder", sublabel: "Not reconstituted · bacteriostatic water optional" },
    ],
  },
  {
    id: "nad-nasal",
    title: "NAD+ Nasal Spray",
    axisLabel: "Strength & Volume",
    options: [
      { slug: "inj-nad-nasal-100-5ml", label: "100 mg/mL · 5 mL" },
      { slug: "inj-nad-nasal-300-15ml", label: "300 mg/mL · 15 mL" },
    ],
  },
  {
    id: "glutathione",
    title: "Glutathione Injection",
    axisLabel: "Strength & Volume",
    options: [
      { slug: "inj-glutathione-200-4ml", label: "200 mg/mL · 4 mL", sublabel: "Supplies included" },
      { slug: "inj-glutathione-200-30ml", label: "200 mg/mL · 30 mL", sublabel: "Supplies sold separately" },
    ],
  },
  {
    id: "tirzepatide",
    title: "Tirzepatide + Pyridoxine",
    axisLabel: "Strength & Volume",
    options: [
      { slug: "glp-tirz-8-1ml", label: "8 mg/mL · 1 mL", sublabel: "25 units weekly" },
      { slug: "glp-tirz-125-1ml", label: "12.5 mg/mL · 1 mL", sublabel: "25 units weekly" },
      { slug: "glp-tirz-125-2ml", label: "12.5 mg/mL · 2 mL", sublabel: "50 units weekly" },
      { slug: "glp-tirz-125-3ml", label: "12.5 mg/mL · 3 mL", sublabel: "75 units weekly" },
      { slug: "glp-tirz-125-4ml", label: "12.5 mg/mL · 4 mL", sublabel: "100 units weekly" },
      { slug: "glp-tirz-20-3ml", label: "20 mg/mL · 3 mL", sublabel: "75 units weekly" },
    ],
  },
  {
    id: "semaglutide",
    title: "Semaglutide + Pyridoxine",
    axisLabel: "Strength & Volume",
    options: [
      { slug: "glp-sema-125-1ml", label: "1.25 mg / 10 mg/mL · 1 mL", sublabel: "25 units weekly" },
      { slug: "glp-sema-25-1ml", label: "2.5 mg / 10 mg/mL · 1 mL", sublabel: "25 units weekly" },
      { slug: "glp-sema-25-2ml", label: "2.5 mg / 10 mg/mL · 2 mL", sublabel: "50 units weekly" },
      { slug: "glp-sema-25-3ml", label: "2.5 mg / 10 mg/mL · 3 mL", sublabel: "75 units weekly" },
      { slug: "glp-sema-25-4ml", label: "2.5 mg / 10 mg/mL · 4 mL", sublabel: "100 units weekly" },
      { slug: "glp-sema-75-4ml", label: "7.5 mg / 10 mg/mL · 4 mL", sublabel: "100 units weekly" },
    ],
  },
  {
    id: "progesterone-ir",
    title: "Progesterone IR (Immediate Release)",
    axisLabel: "Strength & Supply",
    options: [
      { slug: "hrm-progesterone-ir-150-30", label: "150 mg", sublabel: "30-day supply" },
      { slug: "hrm-progesterone-ir-150-60", label: "150 mg", sublabel: "60-day supply" },
      { slug: "hrm-progesterone-ir-225-30", label: "225 mg", sublabel: "30-day supply" },
      { slug: "hrm-progesterone-ir-225-60", label: "225 mg", sublabel: "60-day supply" },
      { slug: "hrm-progesterone-ir-300-30", label: "300 mg", sublabel: "30-day supply" },
      { slug: "hrm-progesterone-ir-300-60", label: "300 mg", sublabel: "60-day supply" },
      { slug: "hrm-progesterone-ir-400-30", label: "400 mg", sublabel: "30-day supply" },
      { slug: "hrm-progesterone-ir-400-60", label: "400 mg", sublabel: "60-day supply" },
    ],
  },
  {
    id: "progesterone-er",
    title: "Progesterone ER (Extended Release)",
    axisLabel: "Strength & Supply",
    options: [
      { slug: "hrm-progesterone-er-100-30", label: "100 mg", sublabel: "30-day supply" },
      { slug: "hrm-progesterone-er-100-60", label: "100 mg", sublabel: "60-day supply" },
      { slug: "hrm-progesterone-er-200-30", label: "200 mg", sublabel: "30-day supply" },
      { slug: "hrm-progesterone-er-200-60", label: "200 mg", sublabel: "60-day supply" },
      { slug: "hrm-progesterone-er-300-30", label: "300 mg", sublabel: "30-day supply" },
      { slug: "hrm-progesterone-er-300-60", label: "300 mg", sublabel: "60-day supply" },
      { slug: "hrm-progesterone-er-400-30", label: "400 mg", sublabel: "30-day supply" },
      { slug: "hrm-progesterone-er-400-60", label: "400 mg", sublabel: "60-day supply" },
    ],
  },
  {
    id: "clomiphene",
    title: "Clomiphene (Clomid) Capsules",
    axisLabel: "Strength & Quantity",
    options: [
      { slug: "hrm-clomid-25-30", label: "25 mg", sublabel: "30 capsules" },
      { slug: "hrm-clomid-25-60", label: "25 mg", sublabel: "60 capsules" },
      { slug: "hrm-clomid-50-30", label: "50 mg", sublabel: "30 capsules" },
      { slug: "hrm-clomid-50-60", label: "50 mg", sublabel: "60 capsules" },
    ],
  },
  {
    id: "estradiol-cream",
    title: "Estradiol Cream",
    axisLabel: "Concentration",
    options: [
      { slug: "hrm-estradiol-cream-04", label: "0.4% (4 mg/mL)", sublabel: "30 g bottle" },
      { slug: "hrm-estradiol-cream-08", label: "0.8% (8 mg/mL)", sublabel: "30 g bottle" },
      { slug: "hrm-estradiol-cream-12", label: "1.2% (12 mg/mL)", sublabel: "30 g bottle" },
    ],
  },
  {
    id: "estradiol-patch",
    title: "Estradiol Transdermal Patch",
    axisLabel: "Strength",
    options: [
      { slug: "hrm-estradiol-patch-025", label: "0.025 mg/day", sublabel: "8-patch pack" },
      { slug: "hrm-estradiol-patch-0375", label: "0.0375 mg/day", sublabel: "8-patch pack" },
      { slug: "hrm-estradiol-patch-05", label: "0.05 mg/day", sublabel: "8-patch pack" },
      { slug: "hrm-estradiol-patch-075", label: "0.075 mg/day", sublabel: "8-patch pack" },
      { slug: "hrm-estradiol-patch-10", label: "0.10 mg/day", sublabel: "8-patch pack" },
    ],
  },
  {
    id: "estrogen-patch",
    title: "Estrogen Transdermal Patch",
    axisLabel: "Strength",
    options: [
      { slug: "hrm-estrogen-patch-025", label: "0.025 mg/day", sublabel: "4-patch pack" },
      { slug: "hrm-estrogen-patch-05", label: "0.05 mg/day", sublabel: "4-patch pack" },
      { slug: "hrm-estrogen-patch-075", label: "0.075 mg/day", sublabel: "4-patch pack" },
      { slug: "hrm-estrogen-patch-10", label: "0.10 mg/day", sublabel: "4-patch pack" },
    ],
  },
  {
    id: "testosterone-cyp-200",
    title: "Testosterone Cypionate 200 mg/mL — Choose Vial Size (Men)",
    axisLabel: "Vial Size",
    options: [
      { slug: "hrm-testosterone-cyp-200-5ml", label: "5 mL Multi-Dose Vial", sublabel: "Supplies sold separately" },
      { slug: "hrm-testosterone-cyp-200-10ml", label: "10 mL Multi-Dose Vial", sublabel: "Supplies included" },
    ],
  },
  {
    id: "testosterone-cyp-100",
    title: "Testosterone Cypionate 100 mg/mL (Men or Women)",
    axisLabel: "Volume",
    options: [
      { slug: "hrm-testosterone-cyp-100-5ml-women", label: "5 mL Vial" },
    ],
  },
  {
    id: "testosterone-cyp-50",
    title: "Testosterone Cypionate 50 mg/mL (Men or Women)",
    axisLabel: "Volume",
    options: [
      { slug: "hrm-testosterone-cyp-50-5ml-women", label: "5 mL Vial" },
    ],
  },
  {
    id: "testosterone-cream",
    title: "Testosterone Cream",
    axisLabel: "Strength & Volume",
    options: [
      { slug: "hrm-testosterone-cream-15ml-20", label: "20 mg/mL · 15 mL" },
      { slug: "hrm-testosterone-cream-15ml-30", label: "30 mg/mL · 15 mL" },
      { slug: "hrm-testosterone-cream-15ml-40", label: "40 mg/mL · 15 mL" },
      { slug: "hrm-testosterone-cream-30ml-20", label: "20 mg/mL · 30 mL" },
      { slug: "hrm-testosterone-cream-30ml-30", label: "30 mg/mL · 30 mL" },
      { slug: "hrm-testosterone-cream-30ml-40", label: "40 mg/mL · 30 mL" },
    ],
  },
  {
    id: "testosterone-troche",
    title: "Testosterone Troches",
    axisLabel: "Strength",
    options: [
      { slug: "hrm-testosterone-troche-5", label: "5 mg", sublabel: "30 count" },
      { slug: "hrm-testosterone-troche-10", label: "10 mg", sublabel: "30 count" },
    ],
  },
  {
    id: "testosterone-vaginal-cream",
    title: "Testosterone Vaginal Cream",
    axisLabel: "Strength & Volume",
    options: [
      { slug: "hrm-testosterone-vaginal-cream", label: "20 mg/mL · 30 mL" },
    ],
  },

  {
    id: "minoxidil",
    title: "Minoxidil 2.5 mg Tablets",
    axisLabel: "Quantity",
    options: [
      { slug: "rx-minoxidil-25-30", label: "30 tablets" },
      { slug: "rx-minoxidil-25-60", label: "60 tablets" },
    ],
  },
  {
    id: "phentermine-375",
    title: "Phentermine 37.5 mg Capsules",
    axisLabel: "Quantity",
    options: [
      { slug: "ctrl-phentermine-375-30", label: "30 capsules" },
      { slug: "ctrl-phentermine-375-60", label: "60 capsules" },
    ],
  },
  {
    id: "phen-topiramate",
    title: "Phentermine HCl / Topiramate",
    axisLabel: "Quantity",
    options: [
      { slug: "ctrl-phen-topiramate-30", label: "15 mg / 20 mg", sublabel: "30 tablets" },
      { slug: "ctrl-phen-topiramate-60", label: "15 mg / 20 mg", sublabel: "60 tablets" },
    ],
  },
  {
    id: "copper-peptide",
    title: "Copper Peptide Cream (GHK-Cu)",
    axisLabel: "Concentration",
    options: [
      { slug: "skin-copper-05", label: "0.5%", sublabel: "30 g tube" },
      { slug: "skin-copper-2", label: "2%", sublabel: "30 g tube" },
      { slug: "skin-copper-4", label: "4%", sublabel: "30 g tube" },
    ],
  },
  {
    id: "ed-sil-tad-rdt",
    title: "Sildenafil 100 mg / Tadalafil 40 mg Rapid Dissolve Tablets",
    axisLabel: "Quantity",
    options: [
      { slug: "ed-sil-tad-rdt-10", label: "10 tablets" },
      { slug: "ed-sil-tad-rdt-20", label: "20 tablets" },
    ],
  },
  {
    id: "ed-tadalafil-75-rdt",
    title: "Tadalafil 75 mg Rapid Dissolve Tablets",
    axisLabel: "Quantity",
    options: [
      { slug: "ed-tadalafil-75-rdt-10", label: "10 tablets" },
      { slug: "ed-tadalafil-75-rdt-20", label: "20 tablets" },
    ],
  },
  {
    id: "testosterone-topiclick-ellage",
    title: "Testosterone TopiClick® Cream — Ellage Base (Vaginal & Vulvar)",
    axisLabel: "Strength",
    options: [
      { slug: "intim-testosterone-ellage-50", label: "50 mg/mL", sublabel: "30 g TopiClick® dispenser" },
      { slug: "intim-testosterone-ellage-100", label: "100 mg/mL", sublabel: "30 g TopiClick® dispenser" },
      { slug: "intim-testosterone-ellage-200", label: "200 mg/mL", sublabel: "30 g TopiClick® dispenser" },
    ],
  },
  {
    id: "testosterone-topiclick-versa",
    title: "Testosterone TopiClick® Cream — Versa Base (External)",
    axisLabel: "Strength",
    options: [
      { slug: "intim-testosterone-versa-50", label: "50 mg/mL", sublabel: "30 g TopiClick® dispenser" },
      { slug: "intim-testosterone-versa-100", label: "100 mg/mL", sublabel: "30 g TopiClick® dispenser" },
      { slug: "intim-testosterone-versa-200", label: "200 mg/mL", sublabel: "30 g TopiClick® dispenser" },
    ],
  },
  {
    id: "estradiol-oral",
    title: "Estradiol Oral Tablets",
    axisLabel: "Strength & Supply",
    options: [
      { slug: "hrm-estradiol-oral-1-30", label: "1 mg", sublabel: "30-day supply" },
      { slug: "hrm-estradiol-oral-1-60", label: "1 mg", sublabel: "60-day supply" },
      { slug: "hrm-estradiol-oral-2-30", label: "2 mg", sublabel: "30-day supply" },
      { slug: "hrm-estradiol-oral-2-60", label: "2 mg", sublabel: "60-day supply" },
    ],
  },
  {
    id: "dhea",
    title: "DHEA Capsules",
    axisLabel: "Strength",
    options: [
      { slug: "hrm-dhea-ir-10-60", label: "10 mg immediate release", sublabel: "60 capsules" },
      { slug: "hrm-dhea-25", label: "25 mg", sublabel: "60 capsules" },
      { slug: "hrm-dhea-ir-75-60", label: "75 mg immediate release", sublabel: "60 capsules" },
    ],
  },
  {
    id: "anastrozole",
    title: "Anastrozole Capsules",
    axisLabel: "Strength",
    options: [
      { slug: "hrm-anastrozole-025-16", label: "0.25 mg", sublabel: "16 capsules · ~2-month course" },
      { slug: "hrm-anastrozole-05-16", label: "0.5 mg", sublabel: "16 capsules · ~2-month course" },
    ],
  },
  {
    id: "omega-3",
    title: "Omega-3",
    axisLabel: "Formulation",
    options: [
      { slug: "vit-omega3-rx-1000-60", label: "Prescription acid ethyl esters 1,000 mg", sublabel: "60 capsules" },
      { slug: "vit-omega3-fish-1000-60", label: "Fish oil 1,000 mg", sublabel: "60 capsules" },
    ],
  },
  {
    id: "micc-injection",
    title: "MICC Injection",
    axisLabel: "Vial Size",
    options: [
      { slug: "vit-micc-10ml", label: "10 mL multi-dose vial", sublabel: "Supplies not included" },
      { slug: "vit-micc-30ml", label: "30 mL multi-dose vial", sublabel: "Supplies not included" },
    ],
  },
  {
    id: "b12-cyano",
    title: "Cyanocobalamin (Vitamin B12)",
    axisLabel: "Vial Size",
    options: [
      { slug: "vit-b12-cyano-10ml", label: "10 mL multi-dose vial", sublabel: "Supplies included" },
      { slug: "vit-b12-cyano-30ml", label: "30 mL multi-dose vial", sublabel: "Supplies sold separately" },
    ],
  },

  {
    id: "lipo-burn-3",
    title: "Lipo Burn 3",
    axisLabel: "Supply",
    options: [
      { slug: "ctrl-lipo-burn-3-30", label: "30-day supply" },
      { slug: "ctrl-lipo-burn-3-60", label: "60-day supply" },
    ],
  },
  {
    id: "lipo-burn-4",
    title: "Lipo Burn 4",
    axisLabel: "Supply",
    options: [
      { slug: "ctrl-lipo-burn-4-30", label: "30-day supply" },
      { slug: "ctrl-lipo-burn-4-60", label: "60-day supply" },
    ],
  },
  {
    id: "biotin-minoxidil",
    title: "Biotin / Minoxidil 5 mg / 3 mg",
    axisLabel: "Supply",
    options: [
      { slug: "hair-biotin-min-30", label: "30-day supply" },
      { slug: "hair-biotin-min-60", label: "60-day supply" },
    ],
  },
  {
    id: "biotin-finasteride-minoxidil",
    title: "Biotin / Finasteride / Minoxidil 5 / 2.5 / 2.5 mg",
    axisLabel: "Supply",
    options: [
      { slug: "hair-biotin-fin-min-30", label: "30-day supply" },
      { slug: "hair-biotin-fin-min-60", label: "60-day supply" },
    ],
  },
];


const SLUG_TO_FAMILY = new Map<string, VariantFamily>();
for (const fam of VARIANT_FAMILIES) {
  for (const opt of fam.options) SLUG_TO_FAMILY.set(opt.slug, fam);
}

export function getFamilyForSlug(slug: string): VariantFamily | null {
  return SLUG_TO_FAMILY.get(slug) ?? null;
}
