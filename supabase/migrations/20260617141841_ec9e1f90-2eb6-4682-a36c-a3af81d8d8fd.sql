
-- Fix UNRESTRICTED_EVENT_INSERT: require caller to own the order or be staff
DROP POLICY IF EXISTS "Authenticated users insert events" ON public.order_events;
CREATE POLICY "Users insert events for own orders"
ON public.order_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_events.order_id
      AND o.user_id = auth.uid()
  )
  OR public.is_staff(auth.uid())
);

-- Lock down SECURITY DEFINER trigger functions: not callable by API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role / is_staff are used in RLS; keep callable by authenticated only, not anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
