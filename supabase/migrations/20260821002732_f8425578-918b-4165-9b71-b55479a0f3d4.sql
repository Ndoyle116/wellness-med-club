
CREATE OR REPLACE FUNCTION public.book_slot_span(
  _slot_id uuid,
  _purpose appointment_purpose,
  _duration_minutes integer,
  _order_id uuid DEFAULT NULL,
  _notes text DEFAULT NULL,
  _product_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_slot RECORD;
  v_next RECORD;
  v_cursor TIMESTAMPTZ;
  v_ids UUID[] := '{}';
  v_end TIMESTAMPTZ;
  v_appointment_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_slot FROM public.provider_availability_slots
   WHERE id = _slot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found'; END IF;
  IF v_slot.is_booked THEN RAISE EXCEPTION 'Slot already booked'; END IF;
  IF v_slot.start_at <= now() THEN RAISE EXCEPTION 'Slot is in the past'; END IF;

  v_ids := ARRAY[v_slot.id];
  v_cursor := v_slot.end_at;
  v_end := v_slot.start_at + make_interval(mins => _duration_minutes);

  WHILE v_cursor < v_end LOOP
    SELECT * INTO v_next FROM public.provider_availability_slots
     WHERE start_at = v_cursor
       AND is_booked = false
       AND (provider_user_id IS NOT DISTINCT FROM v_slot.provider_user_id)
     ORDER BY end_at DESC
     LIMIT 1
     FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Not enough consecutive availability for a % minute visit', _duration_minutes;
    END IF;
    v_ids := v_ids || v_next.id;
    v_cursor := v_next.end_at;
  END LOOP;

  INSERT INTO public.appointments (user_id, order_id, status, scheduled_for, purpose, slot_id, notes, product_id)
  VALUES (v_uid, _order_id, 'scheduled', v_slot.start_at, _purpose, v_slot.id, _notes, _product_id)
  RETURNING id INTO v_appointment_id;

  UPDATE public.provider_availability_slots
     SET is_booked = true, booked_by = v_uid, appointment_id = v_appointment_id, updated_at = now()
   WHERE id = ANY(v_ids);

  RETURN v_appointment_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.book_slot_span(uuid, appointment_purpose, integer, uuid, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_appointment(_appointment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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

  UPDATE public.provider_availability_slots
     SET is_booked = false, booked_by = NULL, appointment_id = NULL, updated_at = now()
   WHERE appointment_id = _appointment_id
      OR (v_appt.slot_id IS NOT NULL AND id = v_appt.slot_id);

  RETURN true;
END;
$function$;
