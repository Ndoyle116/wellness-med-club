
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audience TEXT NOT NULL DEFAULT 'patient',
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- helper: insert for one user
CREATE OR REPLACE FUNCTION public.notify_user(_user_id uuid, _type text, _title text, _body text, _link text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, audience, type, title, body, link)
  SELECT _user_id, 'patient', _type, _title, _body, _link WHERE _user_id IS NOT NULL;
$$;

-- helper: fan out to all staff
CREATE OR REPLACE FUNCTION public.notify_staff(_type text, _title text, _body text, _link text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, audience, type, title, body, link)
  SELECT DISTINCT ur.user_id, 'staff', _type, _title, _body, _link
  FROM public.user_roles ur WHERE ur.role IN ('provider','admin');
$$;

CREATE OR REPLACE FUNCTION public.patient_label(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(NULLIF(TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,'')), ''), 'A patient')
  FROM public.profiles p WHERE p.user_id = _user_id;
$$;

-- ORDERS
CREATE OR REPLACE FUNCTION public.tg_notify_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_staff('order_new', 'New order placed',
      COALESCE(public.patient_label(NEW.user_id),'A patient') || ' placed an order for $' || ROUND(NEW.total_cents/100.0,2),
      '/admin/orders');
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.notify_user(NEW.user_id, 'order_status', 'Order status updated',
      'Your order is now: ' || REPLACE(NEW.status::text, '_', ' '),
      '/account/orders/' || NEW.id);
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER notify_order_insert AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_order();
CREATE TRIGGER notify_order_update AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_order();

-- APPROVALS
CREATE OR REPLACE FUNCTION public.tg_notify_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_product TEXT;
BEGIN
  SELECT name INTO v_product FROM public.products WHERE id = NEW.product_id;
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM public.notify_staff('approval_new', 'Lab review requested',
      public.patient_label(NEW.user_id) || ' submitted labs for ' || COALESCE(v_product,'a product'),
      '/admin/approvals');
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      PERFORM public.notify_user(NEW.user_id, 'approval_approved', 'Labs approved',
        'Your labs for ' || COALESCE(v_product,'your product') || ' were approved. You can continue your order.',
        '/account/approvals');
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

CREATE TRIGGER notify_approval_insert AFTER INSERT ON public.product_approvals
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_approval();
CREATE TRIGGER notify_approval_update AFTER UPDATE ON public.product_approvals
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_approval();

-- MESSAGES
CREATE OR REPLACE FUNCTION public.tg_notify_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.sender_role = 'patient' THEN
    PERFORM public.notify_staff('message_patient', 'New patient message',
      public.patient_label(NEW.thread_user_id) || ': ' || LEFT(NEW.body, 120), '/admin/customers');
  ELSE
    PERFORM public.notify_user(NEW.thread_user_id, 'message_staff', 'New message from your care team',
      LEFT(NEW.body, 120), '/account/messages');
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER notify_message_insert AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_message();

-- APPOINTMENTS
CREATE OR REPLACE FUNCTION public.tg_notify_appointment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_staff('appointment_new', 'New appointment booked',
      public.patient_label(NEW.user_id) || ' booked ' || TO_CHAR(NEW.scheduled_for AT TIME ZONE 'UTC', 'Mon DD, HH24:MI') || ' UTC',
      '/admin/availability');
    PERFORM public.notify_user(NEW.user_id, 'appointment_new', 'Appointment confirmed',
      'Your visit is scheduled for ' || TO_CHAR(NEW.scheduled_for AT TIME ZONE 'UTC', 'Mon DD, HH24:MI') || ' UTC',
      '/account');
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'cancelled' THEN
    PERFORM public.notify_user(NEW.user_id, 'appointment_cancelled', 'Appointment cancelled',
      'Your appointment was cancelled.', '/account');
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER notify_appointment_insert AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_appointment();
CREATE TRIGGER notify_appointment_update AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_appointment();

-- DOCUMENTS
CREATE OR REPLACE FUNCTION public.tg_notify_document()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_staff('document_new', 'New patient document',
    public.patient_label(NEW.user_id) || ' uploaded ' || REPLACE(NEW.doc_type::text,'_',' '),
    '/admin/customers');
  RETURN NULL;
END $$;

CREATE TRIGGER notify_document_insert AFTER INSERT ON public.patient_documents
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_document();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
