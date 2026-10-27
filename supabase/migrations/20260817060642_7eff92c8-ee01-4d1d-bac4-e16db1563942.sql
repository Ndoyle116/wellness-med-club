-- Refill limits per Nicole's spec
UPDATE public.products SET refills_allowed = 0, refill_note = 'No refills — new visit and blood work required.' WHERE slug = 'hrm-testosterone-cyp-200-10ml';
UPDATE public.products SET refills_allowed = 2, refill_note = 'Up to 2 refills — pending provider review and approval.'
 WHERE slug IN ('hrm-testosterone-cyp-200-5ml','hrm-testosterone-cyp-100-5ml-women','hrm-testosterone-cyp-50-5ml-women')
    OR (slug LIKE 'hrm-testosterone-cream%' OR slug LIKE 'hrm-testosterone-vaginal-cream%' OR slug LIKE 'hrm-testosterone-troche%');
UPDATE public.products SET refills_allowed = 2, refill_note = 'Up to two 30-day refills — pending provider review and approval.'
 WHERE slug IN ('ctrl-phentermine-375-30','ctrl-phen-topiramate-30','ctrl-lipo-burn-3-30','ctrl-lipo-burn-4-30');
UPDATE public.products SET refills_allowed = 1, refill_note = 'One 30-day refill — pending provider review and approval.'
 WHERE slug IN ('ctrl-phentermine-375-60','ctrl-phen-topiramate-60','ctrl-lipo-burn-3-60','ctrl-lipo-burn-4-60');

CREATE TABLE public.refill_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined','cancelled')),
  sequence INTEGER NOT NULL DEFAULT 1,
  amount_cents INTEGER NOT NULL,
  payment_intent TEXT,
  captured_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES public.orders(id),
  patient_note TEXT,
  reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.refill_requests TO authenticated;
GRANT ALL ON public.refill_requests TO service_role;

ALTER TABLE public.refill_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients read own refill requests" ON public.refill_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Patients create own refill requests" ON public.refill_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff update refill requests" ON public.refill_requests
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX idx_refill_requests_user_product ON public.refill_requests(user_id, product_id);
CREATE INDEX idx_refill_requests_status ON public.refill_requests(status);

CREATE TRIGGER refill_requests_updated_at BEFORE UPDATE ON public.refill_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.tg_notify_refill()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_product TEXT;
BEGIN
  SELECT name INTO v_product FROM public.products WHERE id = NEW.product_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_staff('refill_new', 'Refill request pending review',
      public.patient_label(NEW.user_id) || ' requested a refill of ' || COALESCE(v_product,'a medication'),
      '/admin/refills');
    PERFORM public.notify_user(NEW.user_id, 'refill_new', 'Refill request received',
      'Your refill of ' || COALESCE(v_product,'your medication') || ' is pending provider review and approval. Your card is authorised but not charged until approval.',
      '/account/refills');
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      PERFORM public.notify_user(NEW.user_id, 'refill_approved', 'Refill approved',
        'Your refill of ' || COALESCE(v_product,'your medication') || ' was approved and your card was charged.',
        '/account/orders');
    ELSIF NEW.status = 'declined' THEN
      PERFORM public.notify_user(NEW.user_id, 'refill_declined', 'Refill declined',
        COALESCE(NEW.reason, 'Your provider declined this refill. You have not been charged.'),
        '/account/refills');
    END IF;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER notify_refill_insert AFTER INSERT ON public.refill_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_refill();
CREATE TRIGGER notify_refill_update AFTER UPDATE ON public.refill_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_refill();