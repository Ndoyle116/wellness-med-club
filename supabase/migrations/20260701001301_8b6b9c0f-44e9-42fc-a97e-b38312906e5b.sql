
-- ============ Enums ============
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'non_fda';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'telehealth_visit';

DO $$ BEGIN
  CREATE TYPE public.consent_scope AS ENUM ('always_required', 'per_product');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.appointment_purpose AS ENUM ('pre_purchase_consult', 'telehealth_visit', 'lab_review', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ Consent template scope ============
ALTER TABLE public.consent_templates
  ADD COLUMN IF NOT EXISTS scope public.consent_scope NOT NULL DEFAULT 'per_product';

-- ============ Products: requires_appointment ============
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS requires_appointment BOOLEAN NOT NULL DEFAULT false;

-- ============ product_consents join table ============
CREATE TABLE IF NOT EXISTS public.product_consents (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  consent_slug TEXT NOT NULL REFERENCES public.consent_templates(slug) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, consent_slug)
);

GRANT SELECT ON public.product_consents TO anon, authenticated;
GRANT ALL ON public.product_consents TO service_role;
ALTER TABLE public.product_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads product_consents" ON public.product_consents;
CREATE POLICY "Anyone reads product_consents" ON public.product_consents
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage product_consents" ON public.product_consents;
CREATE POLICY "Admins manage product_consents" ON public.product_consents
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ Appointment additions ============
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS purpose public.appointment_purpose,
  ADD COLUMN IF NOT EXISTS slot_id UUID;

-- ============ Provider availability slots ============
CREATE TABLE IF NOT EXISTS public.provider_availability_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  purpose public.appointment_purpose NOT NULL DEFAULT 'other',
  is_booked BOOLEAN NOT NULL DEFAULT false,
  booked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_slots_open ON public.provider_availability_slots (start_at) WHERE is_booked = false;
CREATE INDEX IF NOT EXISTS idx_slots_purpose ON public.provider_availability_slots (purpose, start_at);

GRANT SELECT ON public.provider_availability_slots TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.provider_availability_slots TO authenticated;
GRANT ALL ON public.provider_availability_slots TO service_role;

ALTER TABLE public.provider_availability_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone signed-in views open slots" ON public.provider_availability_slots;
CREATE POLICY "Anyone signed-in views open slots" ON public.provider_availability_slots
  FOR SELECT TO authenticated
  USING (
    (is_booked = false AND start_at > now())
    OR booked_by = auth.uid()
    OR public.is_staff(auth.uid())
  );

DROP POLICY IF EXISTS "Staff manage slots" ON public.provider_availability_slots;
CREATE POLICY "Staff manage slots" ON public.provider_availability_slots
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER provider_availability_slots_updated_at
  BEFORE UPDATE ON public.provider_availability_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ book_slot RPC ============
CREATE OR REPLACE FUNCTION public.book_slot(
  _slot_id UUID,
  _purpose public.appointment_purpose,
  _order_id UUID DEFAULT NULL,
  _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_slot RECORD;
  v_appointment_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock the slot row to prevent concurrent bookings
  SELECT * INTO v_slot FROM public.provider_availability_slots
   WHERE id = _slot_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;
  IF v_slot.is_booked THEN
    RAISE EXCEPTION 'Slot already booked';
  END IF;
  IF v_slot.start_at <= now() THEN
    RAISE EXCEPTION 'Slot is in the past';
  END IF;

  INSERT INTO public.appointments (user_id, order_id, status, scheduled_for, purpose, slot_id, notes)
  VALUES (v_uid, _order_id, 'scheduled', v_slot.start_at, _purpose, _slot_id, _notes)
  RETURNING id INTO v_appointment_id;

  UPDATE public.provider_availability_slots
     SET is_booked = true, booked_by = v_uid, appointment_id = v_appointment_id, updated_at = now()
   WHERE id = _slot_id;

  RETURN v_appointment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.book_slot(UUID, public.appointment_purpose, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_slot(UUID, public.appointment_purpose, UUID, TEXT) TO authenticated;

-- ============ cancel_slot RPC (patient cancels own booking) ============
CREATE OR REPLACE FUNCTION public.cancel_appointment(_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_appt RECORD;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_appt FROM public.appointments WHERE id = _appointment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Appointment not found'; END IF;
  IF v_appt.user_id <> v_uid AND NOT public.is_staff(v_uid) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  UPDATE public.appointments SET status = 'cancelled', updated_at = now()
   WHERE id = _appointment_id;

  IF v_appt.slot_id IS NOT NULL THEN
    UPDATE public.provider_availability_slots
       SET is_booked = false, booked_by = NULL, appointment_id = NULL, updated_at = now()
     WHERE id = v_appt.slot_id;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_appointment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_appointment(UUID) TO authenticated;
