-- Replace the combined products read policy with two scoped policies so anon
-- never needs to execute the SECURITY DEFINER helper is_staff().
DROP POLICY IF EXISTS "Anyone reads active products" ON public.products;

CREATE POLICY "Public reads active products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "Staff read all products"
  ON public.products FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- Revoke public execute on is_staff; only authenticated users need it.
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;