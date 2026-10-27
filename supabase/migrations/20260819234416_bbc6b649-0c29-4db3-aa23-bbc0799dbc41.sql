CREATE OR REPLACE FUNCTION public.tg_notify_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_product TEXT; v_slug TEXT;
BEGIN
  SELECT name, slug INTO v_product, v_slug FROM public.products WHERE id = NEW.product_id;
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM public.notify_staff('approval_new', 'Lab review requested',
      public.patient_label(NEW.user_id) || ' submitted labs for ' || COALESCE(v_product,'a product'),
      '/admin/approvals');
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      PERFORM public.notify_user(NEW.user_id, 'approval_approved', 'Great news — your labs were approved',
        'Your labs for ' || COALESCE(v_product,'your product') || ' were approved. You can move forward with your purchase.',
        COALESCE('/products/' || v_slug, '/account/approvals'));
    ELSIF NEW.status = 'disapproved' THEN
      PERFORM public.notify_user(NEW.user_id, 'approval_disapproved', 'Labs need attention',
        COALESCE(NEW.reason, 'Your provider asked for updated labs.'),
        '/account/approvals');
    ELSIF NEW.status = 'pending' AND NEW.resubmitted_at IS NOT NULL THEN
      PERFORM public.notify_staff('approval_new', 'Labs resubmitted',
        public.patient_label(NEW.user_id) || ' resubmitted labs for ' || COALESCE(v_product,'a product'),
        '/admin/approvals');
    END IF;
  END IF;
  RETURN NULL;
END $$;