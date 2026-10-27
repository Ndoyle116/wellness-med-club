import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

const CATEGORIES = ["bundle", "vitamins", "peptides", "lab_panel", "hormone_trt", "controlled", "non_fda", "telehealth_visit", "dermatology", "intimacy", "erectile_dysfunction"] as const;
const PHARMACIES = ["olympia", "rush", "empower", "strive", "other"] as const;

const ProductInput = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters/digits/dashes"),
  category: z.enum(CATEGORIES),
  description: z.string().max(4000).nullable().optional(),
  intended_use: z.string().max(2000).nullable().optional(),
  risks: z.string().max(2000).nullable().optional(),
  price_cents: z.number().int().min(0).max(10_000_000),
  requires_labs: z.boolean(),
  requires_consultation: z.boolean(),
  is_controlled: z.boolean(),
  active: z.boolean(),
  image_url: z.string().url().nullable().optional(),
  pharmacy: z.enum(PHARMACIES).nullable().optional(),
  supplies_available: z.boolean().optional(),
  supplies_price_cents: z.number().int().min(0).max(1_000_000).optional(),
  telehealth_addon_available: z.boolean().optional(),
  telehealth_addon_price_cents: z.number().int().min(0).max(1_000_000).optional(),
  bac_water_available: z.boolean().optional(),
  bac_water_price_cents: z.number().int().min(0).max(1_000_000).optional(),
  purchase_ack_text: z.string().max(2000).nullable().optional(),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden — admin only");
}

function slugToLookupKey(slug: string) {
  return slug.replace(/-/g, "_");
}

// Create or update a Stripe Product + Price with lookup_key = slugified slug.
// Stripe prices are immutable, so when amount/currency changes we create a new
// price and transfer the lookup_key to it (archiving the old one).
async function syncStripePrice(opts: {
  slug: string;
  name: string;
  description?: string | null;
  priceCents: number;
}) {
  const env: StripeEnv = "sandbox";
  const stripe = createStripeClient(env);
  const lookupKey = slugToLookupKey(opts.slug);

  // Find existing price by lookup_key
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
    expand: ["data.product"],
  });

  if (existing.data.length && existing.data[0].unit_amount === opts.priceCents) {
    // Update product metadata only
    const productId =
      typeof existing.data[0].product === "string"
        ? existing.data[0].product
        : existing.data[0].product?.id;
    if (productId) {
      await stripe.products.update(productId, {
        name: opts.name,
        ...(opts.description ? { description: opts.description.slice(0, 500) } : {}),
      });
    }
    return;
  }

  let productId: string | undefined;
  if (existing.data.length) {
    productId =
      typeof existing.data[0].product === "string"
        ? existing.data[0].product
        : existing.data[0].product?.id;
    // Free up lookup_key on the old price so we can transfer it
    await stripe.prices.update(existing.data[0].id, { active: false });
  }

  if (!productId) {
    // Search by metadata.slug
    const search = await stripe.products.search({
      query: `metadata['slug']:'${opts.slug}'`,
      limit: 1,
    });
    if (search.data.length) productId = search.data[0].id;
  }

  if (!productId) {
    const created = await stripe.products.create({
      name: opts.name,
      ...(opts.description ? { description: opts.description.slice(0, 500) } : {}),
      metadata: { slug: opts.slug },
    });
    productId = created.id;
  } else {
    await stripe.products.update(productId, {
      name: opts.name,
      ...(opts.description ? { description: opts.description.slice(0, 500) } : {}),
      metadata: { slug: opts.slug },
    });
  }

  await stripe.prices.create({
    product: productId,
    unit_amount: opts.priceCents,
    currency: "usd",
    lookup_key: lookupKey,
    transfer_lookup_key: true,
  });
}

export const adminListProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("category")
      .order("name");
    if (error) throw new Error(error.message);
    return { products: data ?? [] };
  });

export const adminCreateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProductInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert(data)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message } as const;
    try {
      await syncStripePrice({
        slug: data.slug,
        name: data.name,
        description: data.description,
        priceCents: data.price_cents,
      });
    } catch (e) {
      return {
        ok: true,
        product: row,
        warning: `Product saved but Stripe sync failed: ${getStripeErrorMessage(e)}`,
      } as const;
    }
    return { ok: true, product: row } as const;
  });

const UpdateInput = ProductInput.partial().extend({ id: z.string().uuid() });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message } as const;
    if (
      patch.price_cents !== undefined ||
      patch.name !== undefined ||
      patch.description !== undefined ||
      patch.slug !== undefined
    ) {
      try {
        await syncStripePrice({
          slug: row.slug,
          name: row.name,
          description: row.description,
          priceCents: row.price_cents,
        });
      } catch (e) {
        return {
          ok: true,
          product: row,
          warning: `Saved, but Stripe sync failed: ${getStripeErrorMessage(e)}`,
        } as const;
      }
    }
    return { ok: true, product: row } as const;
  });

export const adminSyncStripePrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("slug, name, description, price_cents")
      .eq("active", true);
    if (error) throw new Error(error.message);
    let synced = 0;
    const failures: string[] = [];
    for (const p of data ?? []) {
      try {
        await syncStripePrice({
          slug: p.slug,
          name: p.name,
          description: p.description,
          priceCents: p.price_cents,
        });
        synced += 1;
      } catch (e) {
        failures.push(`${p.name}: ${getStripeErrorMessage(e)}`);
      }
    }
    return { ok: failures.length === 0, synced, failures } as const;
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Soft-delete by deactivating to preserve order_items FK history.
    const { error } = await supabaseAdmin
      .from("products")
      .update({ active: false })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true } as const;
  });
