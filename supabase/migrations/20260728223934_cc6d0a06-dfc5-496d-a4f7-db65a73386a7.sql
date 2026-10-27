ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'bundle';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS bac_water_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bac_water_price_cents integer NOT NULL DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS purchase_ack_text text;