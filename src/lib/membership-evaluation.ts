import { z } from "zod";

/**
 * Membership evaluation purchase configuration.
 *
 * This module is intentionally independent of product-cart pricing.
 * The server must use EVALUATION_PRICE_CENTS, never a browser-supplied price.
 * This is NOT a payment endpoint and does not authorize charging a patient.
 */
export const EVALUATION_PRICE_CENTS = 19_900;
export const EVALUATION_CURRENCY = "usd" as const;

export const evaluationProgramSchema = z.enum([
  "mens_trt",
  "womens_hrt",
  "phentermine",
  "essential_wellness",
]);

export const evaluationResidencySchema = z.enum(["FL", "NV"]);

export const evaluationSelectionSchema = z.object({
  program: evaluationProgramSchema,
  residency: evaluationResidencySchema,
  policyAcknowledged: z.literal(true),
});

export type EvaluationSelection = z.infer<typeof evaluationSelectionSchema>;

export const evaluationProgramLabels: Record<
  z.infer<typeof evaluationProgramSchema>,
  string
> = {
  mens_trt: "Men's TRT",
  womens_hrt: "Women's HRT",
  phentermine: "Phentermine Weight Loss",
  essential_wellness: "Essential Wellness",
};
