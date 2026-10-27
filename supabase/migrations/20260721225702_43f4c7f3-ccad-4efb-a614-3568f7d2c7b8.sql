
-- Extend product_category enum
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'dermatology';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'intimacy';
