
-- =========================
-- PRODUCT APPROVALS
-- =========================
DO $$ BEGIN
  CREATE TYPE public.product_approval_status AS ENUM ('pending','approved','disapproved','consumed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.product_approval_source AS ENUM ('uploaded_labs','purchased_labs');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.product_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status public.product_approval_status NOT NULL DEFAULT 'pending',
  requested_via public.product_approval_source NOT NULL DEFAULT 'uploaded_labs',
  patient_note TEXT,
  reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  consumed_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_approvals_user ON public.product_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_product_approvals_status ON public.product_approvals(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_approvals_active_per_product
  ON public.product_approvals(user_id, product_id)
  WHERE status IN ('pending','approved');

GRANT SELECT, INSERT, UPDATE ON public.product_approvals TO authenticated;
GRANT ALL ON public.product_approvals TO service_role;

ALTER TABLE public.product_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients read own approvals" ON public.product_approvals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Patients create own approval requests" ON public.product_approvals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Staff update approvals" ON public.product_approvals
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_product_approvals_updated
  BEFORE UPDATE ON public.product_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic consume: called from checkout server fn (via service role).
CREATE OR REPLACE FUNCTION public.consume_approval_for_order(
  _user_id UUID,
  _product_id UUID,
  _order_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
    FROM public.product_approvals
   WHERE user_id = _user_id
     AND product_id = _product_id
     AND status = 'approved'
   ORDER BY reviewed_at DESC NULLS LAST
   LIMIT 1
   FOR UPDATE;
  IF v_id IS NULL THEN
    RETURN FALSE;
  END IF;
  UPDATE public.product_approvals
     SET status = 'consumed',
         consumed_order_id = _order_id,
         consumed_at = now(),
         updated_at = now()
   WHERE id = v_id;
  RETURN TRUE;
END $$;

REVOKE ALL ON FUNCTION public.consume_approval_for_order(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;

-- =========================
-- MESSAGES
-- =========================
DO $$ BEGIN
  CREATE TYPE public.message_sender_role AS ENUM ('patient','staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role public.message_sender_role NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages(thread_user_id)
  WHERE read_at IS NULL;

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own or staff thread" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = thread_user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Patients post to own thread" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = thread_user_id
    AND sender_id = auth.uid()
    AND sender_role = 'patient'
  );

CREATE POLICY "Staff post to any thread" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff(auth.uid())
    AND sender_id = auth.uid()
    AND sender_role = 'staff'
  );

CREATE POLICY "Mark read on own or staff thread" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = thread_user_id OR public.is_staff(auth.uid()))
  WITH CHECK (auth.uid() = thread_user_id OR public.is_staff(auth.uid()));
