
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('patient', 'provider', 'admin');
CREATE TYPE public.us_state AS ENUM ('FL', 'NV');
CREATE TYPE public.product_category AS ENUM ('vitamins', 'peptides', 'lab_panel', 'hormone_trt', 'controlled');
CREATE TYPE public.order_status AS ENUM (
  'pending', 'awaiting_intake', 'awaiting_labs', 'awaiting_consultation',
  'under_review', 'approved', 'rejected', 'prescription_sent', 'fulfilled', 'cancelled'
);
CREATE TYPE public.lab_status AS ENUM ('pending', 'requisition_sent', 'results_received', 'reviewed');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'completed', 'no_show', 'cancelled');

-- ============ UTILITY: updated_at trigger ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('provider', 'admin'))
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  residency_state public.us_state,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + patient role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ INTAKE ============
CREATE TABLE public.intake_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  residency_state public.us_state NOT NULL,
  current_medications TEXT,
  allergies TEXT,
  is_pregnant_or_nursing BOOLEAN DEFAULT false,
  has_cardiac_condition BOOLEAN DEFAULT false,
  has_endocrine_condition BOOLEAN DEFAULT false,
  has_cancer_history BOOLEAN DEFAULT false,
  medical_history TEXT,
  attestation_signed BOOLEAN NOT NULL DEFAULT false,
  attestation_signed_at TIMESTAMPTZ,
  signed_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.intake_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own intake" ON public.intake_responses FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Users insert own intake" ON public.intake_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own intake" ON public.intake_responses FOR UPDATE
  USING (auth.uid() = user_id);
CREATE TRIGGER intake_updated_at BEFORE UPDATE ON public.intake_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_intake_user ON public.intake_responses(user_id);

-- ============ CATALOG ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category public.product_category NOT NULL,
  description TEXT,
  intended_use TEXT,
  risks TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  requires_labs BOOLEAN NOT NULL DEFAULT false,
  requires_consultation BOOLEAN NOT NULL DEFAULT false,
  is_controlled BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active products" ON public.products FOR SELECT
  USING (active = true OR public.is_staff(auth.uid()));
CREATE POLICY "Admins manage products" ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_products_category ON public.products(category) WHERE active = true;

-- ============ CONSENT TEMPLATES ============
CREATE TABLE public.consent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  applies_to public.product_category, -- NULL = general
  body TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consent_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active consents" ON public.consent_templates FOR SELECT
  USING (active = true OR public.is_staff(auth.uid()));
CREATE POLICY "Admins manage consents" ON public.consent_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER consent_templates_updated_at BEFORE UPDATE ON public.consent_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  paid_at TIMESTAMPTZ,
  requires_labs BOOLEAN NOT NULL DEFAULT false,
  requires_consultation BOOLEAN NOT NULL DEFAULT false,
  has_recent_labs BOOLEAN NOT NULL DEFAULT false,
  provider_notes TEXT,
  rejected_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pending orders" ON public.orders FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'awaiting_intake'));
CREATE POLICY "Staff update any order" ON public.orders FOR UPDATE
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- ============ ORDER ITEMS ============
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  product_category_snapshot public.product_category NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    OR public.is_staff(auth.uid())
  );
CREATE POLICY "Users insert items into own orders" ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- ============ CONSENT SIGNATURES ============
CREATE TABLE public.consent_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  consent_template_id UUID NOT NULL REFERENCES public.consent_templates(id),
  template_version INTEGER NOT NULL,
  signature_text TEXT NOT NULL, -- typed name
  signed_ip TEXT,
  signed_user_agent TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consent_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own signatures" ON public.consent_signatures FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Users insert own signatures" ON public.consent_signatures FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_signatures_user ON public.consent_signatures(user_id);
CREATE INDEX idx_signatures_order ON public.consent_signatures(order_id);

-- ============ LAB ORDERS ============
CREATE TABLE public.lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id),
  status public.lab_status NOT NULL DEFAULT 'pending',
  panel_name TEXT NOT NULL,
  requisition_sent_at TIMESTAMPTZ,
  results_received_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own labs" ON public.lab_orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff insert labs" ON public.lab_orders FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update labs" ON public.lab_orders FOR UPDATE
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER lab_orders_updated_at BEFORE UPDATE ON public.lab_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_lab_orders_user ON public.lab_orders(user_id);

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  scheduled_for TIMESTAMPTZ,
  external_booking_url TEXT,
  external_reference TEXT, -- SimplePractice ID if/when known
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own appointments" ON public.appointments FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Users insert own appointments" ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff update appointments" ON public.appointments FOR UPDATE
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_appointments_user ON public.appointments(user_id);

-- ============ ORDER EVENTS (audit log) ============
CREATE TABLE public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  from_status public.order_status,
  to_status public.order_status,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order events" ON public.order_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    OR public.is_staff(auth.uid())
  );
CREATE POLICY "Authenticated users insert events" ON public.order_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE INDEX idx_order_events_order ON public.order_events(order_id);
