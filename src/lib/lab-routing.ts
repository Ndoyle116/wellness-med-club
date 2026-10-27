import type { Database } from "@/integrations/supabase/types";
import { getHormoneGenders } from "@/lib/hormone-gender";

type Category = Database["public"]["Enums"]["product_category"];
export type PatientSex = "male" | "female";

export type LabRoute = {
  /** Human label for the lab requirement, used in the "last 6 months" question. */
  label: string;
  /** Lab product slugs for male patients. */
  male: string[];
  /** Lab product slugs for female patients. */
  female: string[];
  /** True when the patient's sex must be known to pick the right panel. */
  sexDependent: boolean;
  /** Telehealth visit is mandatory (controlled substances). */
  telehealthRequired: boolean;
};

/** Standalone add-on offered alongside any routed panel. */
export const STANDALONE_LAB_SLUGS = ["lab-urinalysis-reflex"];

const both = (slugs: string[]) => ({ male: slugs, female: slugs });

/**
 * Route a medication to the correct lab panel(s) based on category + sex.
 * Returns null when no lab routing is defined for the product.
 */
export function getLabRoute(
  slug: string,
  name: string,
  category: Category,
): LabRoute | null {
  const s = slug.toLowerCase();
  const n = (name ?? "").toLowerCase();

  // Bundles route explicitly — their names don't contain the medication words.
  if (s === "bundle-menopause-starter" || s === "bundle-estradiol-progesterone") {
    return {
      label: "HRT blood work (one-time baseline)",
      ...both(["lab-womens-hrt-monitoring"]),
      sexDependent: false,
      telehealthRequired: false,
    };
  }
  if (s === "bundle-womens-hrt") {
    return {
      label: "HRT blood work",
      ...both(["lab-womens-hrt-monitoring"]),
      sexDependent: false,
      telehealthRequired: true,
    };
  }
  if (s === "bundle-mens-trt-starter") {
    return {
      label: "TRT blood work",
      ...both(["lab-male-trt-monitoring"]),
      sexDependent: false,
      telehealthRequired: true,
    };
  }


  // Testosterone / TRT — mandatory telehealth (controlled substance)
  if (s.startsWith("hrm-testosterone") || n.includes("testosterone")) {
    const genders = getHormoneGenders(slug, name);
    const menOnly = genders.length === 1 && genders[0] === "men";
    const womenOnly = genders.length === 1 && genders[0] === "women";
    // The SKU already states the audience (e.g. "… (Men)") — don't ask again.
    if (menOnly || womenOnly) {
      const panel = menOnly ? "lab-male-trt-monitoring" : "lab-womens-hrt-monitoring";
      return {
        label: "testosterone / hormone monitoring",
        ...both([panel]),
        sexDependent: false,
        telehealthRequired: true,
      };
    }
    return {
      label: "testosterone / hormone monitoring",
      male: ["lab-male-trt-monitoring"],
      female: ["lab-womens-hrt-monitoring"],
      sexDependent: true,
      telehealthRequired: true,
    };
  }


  // Phentermine — mandatory telehealth (controlled substance)
  if (s.startsWith("ctrl-phen") || n.includes("phentermine")) {
    return {
      label: "phentermine",
      male: ["lab-phentermine-male"],
      female: ["lab-phentermine-female"],
      sexDependent: true,
      telehealthRequired: true,
    };
  }

  // GLP-1
  if (s.startsWith("glp-") || n.includes("semaglutide") || n.includes("tirzepatide")) {
    return {
      label: "GLP-1",
      male: ["lab-glp1-male"],
      female: ["lab-glp1-female"],
      sexDependent: true,
      telehealthRequired: false,
    };
  }

  // Female HRT — estrogen / progesterone / combos
  if (
    s.startsWith("hrm-estrogen") ||
    s.startsWith("hrm-estradiol") ||
    s.startsWith("hrm-progesterone") ||
    n.includes("estrogen") ||
    n.includes("estradiol") ||
    n.includes("progesterone")
  ) {
    return {
      label: "female hormone (HRT)",
      ...both(["lab-female-hormone-panel"]),
      sexDependent: false,
      telehealthRequired: false,
    };
  }

  // Vitamin D
  if (s.startsWith("vit-d3") || n.includes("vitamin d")) {
    return {
      label: "Vitamin D",
      ...both(["lab-vitamin-d-addon"]),
      sexDependent: false,
      telehealthRequired: false,
    };
  }

  // Vitamin B12
  if (s.startsWith("vit-b12") || n.includes("b12")) {
    return {
      label: "Vitamin B12",
      ...both(["lab-b12-addon"]),
      sexDependent: false,
      telehealthRequired: false,
    };
  }

  // Remaining hormone products default to the sex-appropriate monitoring panel.
  if (category === "hormone_trt") {
    const genders = getHormoneGenders(slug, name);
    if (genders.length === 1) {
      return {
        label: "hormone monitoring",
        ...both([
          genders[0] === "men" ? "lab-male-trt-monitoring" : "lab-womens-hrt-monitoring",
        ]),
        sexDependent: false,
        telehealthRequired: false,
      };
    }
    return {
      label: "hormone monitoring",
      male: ["lab-male-trt-monitoring"],
      female: ["lab-womens-hrt-monitoring"],
      sexDependent: true,
      telehealthRequired: false,
    };
  }


  return null;
}

export function panelsForSex(route: LabRoute, sex: PatientSex | null): string[] {
  if (!route.sexDependent) return route.male;
  if (!sex) return [];
  return sex === "male" ? route.male : route.female;
}

export const LAB_CHARGE_DISCLOSURE =
  "Purchasing laboratory testing does not guarantee approval for medication or treatment. Laboratory fees are separate from medication/treatment fees and are charged when the laboratory order is placed.";
