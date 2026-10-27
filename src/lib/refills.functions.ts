import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "@/lib/approvals.server";
import { z } from "zod";
import {
  adminDecideRefillHandler,
  adminDecideRefillInputSchema,
  adminListRefillsHandler,
  createRefillPaymentHandler,
  createRefillPaymentInputSchema,
  finalizeRefillInputSchema,
  finalizeRefillRequestHandler,
  getRefillEligibilityHandler,
  listMyRefillsHandler,
  productIdInputSchema,
} from "@/lib/refills.server";

/** PATIENT: can this medication be refilled right now? */
export const getRefillEligibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productIdInputSchema.parse(input))
  .handler(async ({ data, context }) => getRefillEligibilityHandler(data, context));

/** PATIENT: authorise the refill amount (captured only if approved). */
export const createRefillPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createRefillPaymentInputSchema.parse(input))
  .handler(async ({ data, context }) => createRefillPaymentHandler(data, context));

/** PATIENT: submit the refill for provider review. */
export const submitRefillRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => finalizeRefillInputSchema.parse(input))
  .handler(async ({ data, context }) => finalizeRefillRequestHandler(data, context));

/** PATIENT: refill history. */
export const listMyRefills = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listMyRefillsHandler(context));

/** STAFF: refill review queue. */
export const adminListRefills = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ status: z.string().default("pending") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    return adminListRefillsHandler(data);
  });

/** STAFF: approve (charge) or decline (release) a refill. */
export const adminDecideRefill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => adminDecideRefillInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    return adminDecideRefillHandler(data, context);
  });
