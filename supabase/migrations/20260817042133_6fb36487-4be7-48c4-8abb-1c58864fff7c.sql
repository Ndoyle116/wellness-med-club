
CREATE TABLE public.discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  min_order_cents integer NOT NULL DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_coupons TO authenticated;
GRANT ALL ON public.discount_coupons TO service_role;

ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage coupons" ON public.discount_coupons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER discount_coupons_updated_at BEFORE UPDATE ON public.discount_coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.validate_discount_coupon(_code text, _subtotal_cents integer)
RETURNS TABLE(code text, discount_type text, discount_value numeric, discount_cents integer, error text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.discount_coupons%ROWTYPE;
  d integer;
BEGIN
  SELECT * INTO c FROM public.discount_coupons
   WHERE UPPER(TRIM(public.discount_coupons.code)) = UPPER(TRIM(_code))
     AND is_active = true
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::integer, 'invalid'::text;
    RETURN;
  END IF;
  IF c.starts_at > now() THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::integer, 'not_started'::text;
    RETURN;
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::integer, 'expired'::text;
    RETURN;
  END IF;
  IF c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::integer, 'max_uses'::text;
    RETURN;
  END IF;
  IF _subtotal_cents < c.min_order_cents THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::integer,
      ('min_order:' || c.min_order_cents::text);
    RETURN;
  END IF;

  IF c.discount_type = 'percentage' THEN
    d := FLOOR(_subtotal_cents * c.discount_value / 100.0);
  ELSE
    d := FLOOR(c.discount_value * 100);
  END IF;
  IF d > _subtotal_cents THEN d := _subtotal_cents; END IF;
  IF d < 0 THEN d := 0; END IF;

  RETURN QUERY SELECT c.code, c.discount_type, c.discount_value, d, NULL::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_discount_coupon(text, integer) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.increment_coupon_use(_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.discount_coupons
     SET used_count = used_count + 1, updated_at = now()
   WHERE UPPER(TRIM(code)) = UPPER(TRIM(_code));
$$;

REVOKE EXECUTE ON FUNCTION public.increment_coupon_use(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_use(text) TO service_role;
