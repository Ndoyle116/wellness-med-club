-- 1. Enum for pharmacy source
CREATE TYPE public.pharmacy_source AS ENUM ('olympia', 'rush', 'empower', 'strive', 'other');

-- 2. Columns
ALTER TABLE public.products ADD COLUMN pharmacy public.pharmacy_source;
ALTER TABLE public.order_items ADD COLUMN pharmacy_snapshot public.pharmacy_source;

-- 3. Backfill pharmacy from parenthesized tags in existing name/description
UPDATE public.products SET pharmacy =
  CASE
    WHEN name ~* '\(rush\)'    OR description ~* '\(rush\)'    THEN 'rush'::public.pharmacy_source
    WHEN name ~* '\(olympia\)' OR description ~* '\(olympia\)' THEN 'olympia'::public.pharmacy_source
    WHEN name ~* '\(empower\)' OR description ~* '\(empower\)' THEN 'empower'::public.pharmacy_source
    WHEN name ~* '\(strive\)'  OR description ~* '\(strive\)'  THEN 'strive'::public.pharmacy_source
    ELSE NULL
  END;

-- 4. Strip pharmacy tag from customer-facing name & description
UPDATE public.products SET
  name = btrim(regexp_replace(name, '\s*\((?:Rush|Olympia|Empower|Strive)\)\.?\s*', ' ', 'gi')),
  description = CASE
    WHEN description IS NULL THEN NULL
    ELSE btrim(regexp_replace(description, '\s*\((?:Rush|Olympia|Empower|Strive)\)\.?\s*', ' ', 'gi'))
  END;

-- Collapse any double spaces the strip may have introduced
UPDATE public.products SET
  name = regexp_replace(name, '\s{2,}', ' ', 'g'),
  description = CASE WHEN description IS NULL THEN NULL ELSE regexp_replace(description, '\s{2,}', ' ', 'g') END;

-- 5. Backfill pharmacy_snapshot on existing order_items
UPDATE public.order_items oi
SET pharmacy_snapshot = p.pharmacy
FROM public.products p
WHERE oi.product_id = p.id AND oi.pharmacy_snapshot IS NULL;

-- 6. Public products view (excludes pharmacy). SECURITY DEFINER (default) so it
--    bypasses RLS on the base table for the fixed set of "active" rows.
CREATE OR REPLACE VIEW public.products_public AS
SELECT
  id, slug, name, category, description, intended_use, risks,
  price_cents, requires_labs, requires_consultation, is_controlled,
  active, image_url, requires_appointment, created_at, updated_at
FROM public.products
WHERE active = true;

GRANT SELECT ON public.products_public TO anon, authenticated;

-- 7. Lock down the base products table for regular users so pharmacy is not
--    readable via SELECT *. Staff/admin policies remain and still see pharmacy.
DROP POLICY IF EXISTS "Public reads active products" ON public.products;
REVOKE SELECT ON public.products FROM anon;
-- Authenticated non-staff users have no matching SELECT policy on the base
-- table now; they must go through products_public. Staff/admin policies
-- ("Staff read all products", "Admins manage products") still grant access.

-- 8. Hide pharmacy_snapshot column on order_items from customers.
REVOKE SELECT (pharmacy_snapshot) ON public.order_items FROM anon, authenticated;
-- service_role (used by supabaseAdmin) retains full access.