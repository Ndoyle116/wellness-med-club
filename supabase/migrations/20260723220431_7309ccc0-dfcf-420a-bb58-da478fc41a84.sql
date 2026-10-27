ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS refills_allowed INTEGER,
  ADD COLUMN IF NOT EXISTS refill_note TEXT,
  ADD COLUMN IF NOT EXISTS repeat_labs_interval TEXT;