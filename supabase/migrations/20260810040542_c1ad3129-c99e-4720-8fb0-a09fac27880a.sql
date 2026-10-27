ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id);

CREATE OR REPLACE FUNCTION public.book_slot(_slot_id uuid, _purpose appointment_purpose, _order_id uuid DEFAULT NULL::uuid, _notes text DEFAULT NULL::text, _product_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_slot RECORD;
  v_appointment_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

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

  INSERT INTO public.appointments (user_id, order_id, status, scheduled_for, purpose, slot_id, notes, product_id)
  VALUES (v_uid, _order_id, 'scheduled', v_slot.start_at, _purpose, _slot_id, _notes, _product_id)
  RETURNING id INTO v_appointment_id;

  UPDATE public.provider_availability_slots
     SET is_booked = true, booked_by = v_uid, appointment_id = v_appointment_id, updated_at = now()
   WHERE id = _slot_id;

  RETURN v_appointment_id;
END;
$function$;