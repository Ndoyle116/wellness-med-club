-- Undo the SECURITY DEFINER view; use column-level grants on the base table.
DROP VIEW IF EXISTS public.products_public;

-- Re-add the public read policy on the base products table (rows: active only).
CREATE POLICY "Public reads active products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Revoke any lingering table-level SELECT to force column-level checks.
REVOKE SELECT ON public.products FROM anon, authenticated;

-- Grant SELECT on every column EXCEPT pharmacy.
GRANT SELECT
  (id, slug, name, category, description, intended_use, risks,
   price_cents, requires_labs, requires_consultation, is_controlled,
   active, image_url, requires_appointment, created_at, updated_at)
  ON public.products TO anon, authenticated;

-- Staff/admin get full access via service_role (supabaseAdmin) in server fns.
GRANT ALL ON public.products TO service_role;