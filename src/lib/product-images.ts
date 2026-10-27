import nad200 from "@/assets/product-nad-200-5ml.jpg";
import nad100 from "@/assets/product-nad-100-10ml.jpg";
import nadNasal from "@/assets/products/nad-nasal.jpg";
import glutathione from "@/assets/products/glutathione.jpg";
import tirzepatide from "@/assets/products/tirzepatide.jpg";
import semaglutide from "@/assets/products/semaglutide.jpg";
import progesterone from "@/assets/products/progesterone.jpg";
import clomiphene from "@/assets/products/clomiphene.jpg";
import estradiolCream from "@/assets/products/estradiol-cream.jpg";
import estradiolPatch from "@/assets/products/estradiol-patch.jpg";
import testosteroneVial from "@/assets/products/testosterone-vial.jpg";
import testosteroneCream from "@/assets/products/testosterone-cream.jpg";
import testosteroneTroche from "@/assets/products/testosterone-troche.jpg";
import minoxidil from "@/assets/products/minoxidil.jpg";
import phentermine from "@/assets/products/phentermine.jpg";
import copperPeptide from "@/assets/products/copper-peptide.jpg";
import ondansetron from "@/assets/products/ondansetron.jpg";
import bComplex from "@/assets/products/b-complex.jpg";
import b12 from "@/assets/products/b12.jpg";
import coq10 from "@/assets/products/coq10.jpg";
import vitaminDCaps from "@/assets/products/vitamin-d-caps.jpg";
import vitaminDInj from "@/assets/products/vitamin-d-inj.jpg";
import triImmune from "@/assets/products/tri-immune.jpg";
import sermorelin from "@/assets/products/sermorelin.jpg";
import dhea from "@/assets/products/dhea.jpg";
import labPanel from "@/assets/products/lab-panel.jpg";

// Explicit per-slug overrides.
const EXPLICIT: Record<string, string> = {
  "inj-nad-200-5ml": nad200,
  "inj-nad-100-10ml": nad100,
  "inj-nad-nasal-100-5ml": nadNasal,
  "inj-nad-nasal-300-15ml": nadNasal,
  "inj-glutathione-200-4ml": glutathione,
  "inj-glutathione-200-30ml": glutathione,
  "inj-tri-immune-30ml": triImmune,
  "pep-sermorelin-09-10ml": sermorelin,
  "rx-ondansetron-4-30": ondansetron,
  "vit-b-complex-inj-30ml": bComplex,
  "vit-b12-cyano-10ml": b12,
  "vit-b12-methyl-10ml": b12,
  "vit-coq10-injection-30ml": coq10,
  "vit-d3-50k-caps": vitaminDCaps,
  "vit-d3-50k-inj": vitaminDInj,
  "hrm-dhea-25": dhea,
  "hrm-testosterone-vaginal-cream": estradiolCream,
};

// Prefix → image mapping for families with many SKUs.
const PREFIX_RULES: Array<[string, string]> = [
  ["glp-tirz-", tirzepatide],
  ["glp-sema-", semaglutide],
  ["hrm-progesterone-", progesterone],
  ["hrm-clomid-", clomiphene],
  ["hrm-estradiol-cream-", estradiolCream],
  ["hrm-estradiol-patch-", estradiolPatch],
  ["hrm-estrogen-patch-", estradiolPatch],
  ["hrm-testosterone-cyp-", testosteroneVial],
  ["hrm-testosterone-cream-", testosteroneCream],
  ["hrm-testosterone-troche-", testosteroneTroche],
  ["intim-testosterone-", testosteroneCream],
  ["rx-minoxidil-", minoxidil],
  ["ctrl-phentermine-", phentermine],
  ["ctrl-phen-topiramate-", phentermine],
  ["skin-copper-", copperPeptide],
  ["lab-", labPanel],
];

export function getProductImage(slug: string): string | undefined {
  if (EXPLICIT[slug]) return EXPLICIT[slug];
  for (const [prefix, url] of PREFIX_RULES) {
    if (slug.startsWith(prefix)) return url;
  }
  return undefined;
}

export const PRODUCT_IMAGES = new Proxy({} as Record<string, string>, {
  get: (_t, key: string) => getProductImage(key),
});
