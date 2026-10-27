import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createManualLabReviewPaymentHandler,
  createManualLabReviewPaymentInputSchema,
  finalizeManualLabReviewPaymentHandler,
  finalizeManualLabReviewPaymentInputSchema,
} from "@/lib/lab-review-fee.server";

/** Start the $20 manual lab review charge. */
export const createManualLabReviewPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createManualLabReviewPaymentInputSchema.parse(input))
  .handler(async ({ data, context }) => createManualLabReviewPaymentHandler(data, context));

/** Confirm the review fee and open the clinician review request. */
export const finalizeManualLabReviewPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => finalizeManualLabReviewPaymentInputSchema.parse(input))
  .handler(async ({ data, context }) => finalizeManualLabReviewPaymentHandler(data, context));
