import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createCheckoutSessionHandler,
  createCheckoutSessionInputSchema,
  createPaymentSessionForApprovedOrderHandler,
  getOrderStatusHandler,
  orderStatusInputSchema,
  payApprovedOrderInputSchema,
} from "@/lib/checkout-session.server";

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createCheckoutSessionInputSchema.parse(input))
  .handler(async ({ data, context }) => createCheckoutSessionHandler(data, context));

export const createPaymentSessionForApprovedOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => payApprovedOrderInputSchema.parse(input))
  .handler(async ({ data, context }) => createPaymentSessionForApprovedOrderHandler(data, context));

export const getOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderStatusInputSchema.parse(input))
  .handler(async ({ data, context }) => getOrderStatusHandler(data, context));