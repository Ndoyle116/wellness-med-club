import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CouponInput = z.object({
  code: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, dashes or underscores only"),
  description: z.string().max(300).optional().default(""),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().min(0).max(100000),
  min_order_cents: z.number().int().min(0).max(10_000_000).optional().default(0),
  max_uses: z.number().int().min(1).max(1_000_000).nullable().optional(),
  is_active: z.boolean(),
  starts_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  min_eligible_items: z.number().int().min(0).max(100).optional().default(0),
  excludes_flagged_products: z.boolean().optional().default(false),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden — admin only");
}

function toRow(input: z.infer<typeof CouponInput>) {
  if (input.discount_type === "percentage" && input.discount_value > 100) {
    throw new Error("Percentage discount cannot exceed 100%.");
  }
  return {
    code: input.code.trim().toUpperCase(),
    description: input.description ?? "",
    discount_type: input.discount_type,
    discount_value: input.discount_value,
    min_order_cents: input.min_order_cents ?? 0,
    max_uses: input.max_uses ?? null,
    is_active: input.is_active,
    starts_at: input.starts_at ? new Date(input.starts_at).toISOString() : new Date().toISOString(),
    expires_at: input.expires_at ? new Date(input.expires_at).toISOString() : null,
    min_eligible_items: input.min_eligible_items ?? 0,
    excludes_flagged_products: input.excludes_flagged_products ?? false,
  };
}

export const adminListCoupons = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { data, error } = await (context as any).supabase
      .from("discount_coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { coupons: data ?? [] };
  });

export const adminCreateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CouponInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { error } = await (context as any).supabase.from("discount_coupons").insert(toRow(data));
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    CouponInput.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { id, ...rest } = data;
    const { error } = await (context as any).supabase
      .from("discount_coupons")
      .update(toRow(rest as any))
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { error } = await (context as any).supabase
      .from("discount_coupons")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Shopper-facing check — returns the discount for a code without exposing the coupon list. */
export const previewCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string().min(1).max(40),
        items: z
          .array(
            z.object({
              productId: z.string().uuid(),
              quantity: z.number().int().min(1).max(100),
            }),
          )
          .min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await (context as any).supabase.rpc(
      "validate_discount_coupon_cart",
      {
        _code: data.code,
        _items: data.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      },
    );
    if (error) throw new Error(error.message);
    const row = (rows ?? [])[0];
    if (!row || row.error) {
      return { valid: false as const, error: (row?.error as string) ?? "invalid" };
    }
    return {
      valid: true as const,
      code: row.code as string,
      discountCents: Number(row.discount_cents ?? 0),
    };
  });
