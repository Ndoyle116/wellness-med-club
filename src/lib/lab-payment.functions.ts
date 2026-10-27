import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createLabPanelPaymentHandler,
  createLabPanelPaymentInputSchema,
  finalizeLabPanelPaymentHandler,
  finalizeLabPanelPaymentInputSchema,
  getLabPurchaseConsentsHandler,
  labPurchaseConsentsInputSchema,
} from "@/lib/lab-payment.server";

/** Charge the lab fee inline and place the medication order on hold. */
export const createLabPanelPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createLabPanelPaymentInputSchema.parse(input))
  .handler(async ({ data, context }) => createLabPanelPaymentHandler(data, context));

/** After the Payment Element succeeds, authorise the medication amount. */
export const finalizeLabPanelPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => finalizeLabPanelPaymentInputSchema.parse(input))
  .handler(async ({ data, context }) => finalizeLabPanelPaymentHandler(data, context));

/** Consents required before the lab fee can be charged, with signature status. */
export const getLabPurchaseConsents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => labPurchaseConsentsInputSchema.parse(input))
  .handler(async ({ data, context }) => getLabPurchaseConsentsHandler(data, context));
