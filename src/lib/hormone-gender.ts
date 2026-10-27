export type HormoneGender = "men" | "women";

/**
 * Classify a hormone_trt product's audience.
 * Returns one or both genders — items that are not gender-specific (e.g. DHEA,
 * generic testosterone troches, general TRT support) appear on BOTH tabs.
 */
export function getHormoneGenders(slug: string, name?: string): HormoneGender[] {
  const s = slug.toLowerCase();
  const n = (name ?? "").toLowerCase();

  // Explicit gender tags win
  if (n.includes("(women)") || s.includes("-women")) return ["women"];
  if (n.includes("(men)") || s.includes("-men")) return ["men"];

  // Women-only anatomy / hormones
  if (n.includes("vaginal") || s.startsWith("hrm-vaginal") || s.includes("vaginal")) return ["women"];
  if (s.startsWith("hrm-progesterone") || n.includes("progesterone")) return ["women"];
  if (s.startsWith("hrm-estradiol") || n.includes("estradiol")) return ["women"];
  if (s.startsWith("hrm-estrogen") || n.includes("estrogen")) return ["women"];

  // Testosterone troches are prescribed for women in this practice
  if (s.includes("troche") || n.includes("troche")) return ["women"];

  // Men-only: Clomid / hCG / anastrozole are typically for men's TRT support
  if (s.includes("clomid") || n.includes("clomiphene")) return ["men"];
  if (s.includes("anastrozole") || n.includes("anastrozole")) return ["men"];
  if (s.includes("hcg") || n.includes("hcg")) return ["men"];

  // Shared items — DHEA, generic testosterone cream/troche without gender tag, etc.
  return ["men", "women"];
}

/** Back-compat single-gender helper (returns first). Prefer getHormoneGenders. */
export function getHormoneGender(slug: string, name?: string): HormoneGender {
  return getHormoneGenders(slug, name)[0];
}
