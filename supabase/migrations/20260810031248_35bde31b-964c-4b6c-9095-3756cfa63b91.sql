ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS lab_payment_intent text,
  ADD COLUMN IF NOT EXISTS hold_payment_intent text,
  ADD COLUMN IF NOT EXISTS hold_captured_at timestamp with time zone;