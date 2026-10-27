CREATE TABLE public.contact_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  residency_state TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  staff_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_inquiries
  ADD CONSTRAINT contact_inquiries_status_check CHECK (status IN ('new','read'));

GRANT INSERT ON public.contact_inquiries TO anon;
GRANT INSERT, SELECT, UPDATE ON public.contact_inquiries TO authenticated;
GRANT ALL ON public.contact_inquiries TO service_role;

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact inquiry"
  ON public.contact_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can read contact inquiries"
  ON public.contact_inquiries FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update contact inquiries"
  ON public.contact_inquiries FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX contact_inquiries_created_at_idx ON public.contact_inquiries (created_at DESC);

CREATE TRIGGER update_contact_inquiries_updated_at
  BEFORE UPDATE ON public.contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();