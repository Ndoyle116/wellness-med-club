ALTER TABLE public.discount_coupons
  ADD COLUMN IF NOT EXISTS min_eligible_items integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS excludes_flagged_products boolean NOT NULL DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promo_excluded boolean NOT NULL DEFAULT false;

UPDATE public.products
   SET promo_excluded = true
 WHERE (name ILIKE '%testosterone%' OR name ILIKE '%phentermine%')
   AND category NOT IN ('lab_panel', 'bundle');

CREATE OR REPLACE FUNCTION public.validate_discount_coupon_cart(_code text, _items jsonb)
RETURNS TABLE(code text, discount_type text, discount_value numeric, discount_cents integer,
              eligible_items integer, eligible_subtotal_cents integer, error text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.discount_coupons%ROWTYPE;
  d integer;
  total_cents integer := 0;
  elig_cents integer := 0;
  elig_count integer := 0;
BEGIN
  SELECT * INTO c FROM public.discount_coupons
   WHERE UPPER(TRIM(public.discount_coupons.code)) = UPPER(TRIM(_code))
     AND is_active = true
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::integer, 0, 0, 'invalid'::text;
    RETURN;
  END IF;

  SELECT
    COALESCE(SUM(p.price_cents * i.quantity), 0),
    COALESCE(SUM(CASE WHEN c.excludes_flagged_products AND p.promo_excluded THEN 0
                      ELSE p.price_cents * i.quantity END), 0),
    COALESCE(SUM(CASE WHEN c.excludes_flagged_products AND p.promo_excluded THEN 0
                      ELSE i.quantity END), 0)
    INTO total_cents, elig_cents, elig_count
  FROM jsonb_to_recordset(COALESCE(_items, '[]'::jsonb)) AS i(product_id uuid, quantity integer)
  JOIN public.products p ON p.id = i.product_id;

  IF c.starts_at > now() THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::integer, elig_count, elig_cents, 'not_started'::text;
    RETURN;
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::integer, elig_count, elig_cents, 'expired'::text;
    RETURN;
  END IF;
  IF c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::integer, elig_count, elig_cents, 'max_uses'::text;
    RETURN;
  END IF;
  IF total_cents < c.min_order_cents THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::integer, elig_count, elig_cents,
      ('min_order:' || c.min_order_cents::text);
    RETURN;
  END IF;
  IF c.min_eligible_items > 0 AND elig_count < c.min_eligible_items THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::integer, elig_count, elig_cents,
      ('min_items:' || c.min_eligible_items::text);
    RETURN;
  END IF;
  IF elig_cents <= 0 THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::integer, elig_count, elig_cents, 'no_eligible_items'::text;
    RETURN;
  END IF;

  IF c.discount_type = 'percentage' THEN
    d := FLOOR(elig_cents * c.discount_value / 100.0);
  ELSE
    d := FLOOR(c.discount_value * 100);
  END IF;
  IF d > elig_cents THEN d := elig_cents; END IF;
  IF d < 0 THEN d := 0; END IF;

  RETURN QUERY SELECT c.code, c.discount_type, c.discount_value, d, elig_count, elig_cents, NULL::text;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.validate_discount_coupon_cart(text, jsonb) TO authenticated, service_role;