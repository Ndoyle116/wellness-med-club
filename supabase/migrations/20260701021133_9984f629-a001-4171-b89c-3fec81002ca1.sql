
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS supplies_available BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supplies_price_cents INTEGER NOT NULL DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS telehealth_addon_available BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telehealth_addon_price_cents INTEGER NOT NULL DEFAULT 5000;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS add_ons JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill: enable supplies for injectable categories
UPDATE public.products
   SET supplies_available = true
 WHERE category IN ('peptides', 'hormone_trt', 'controlled')
   AND supplies_available = false;

-- Backfill: enable optional tele-visit for anything that doesn't already require a consult
-- and isn't itself a telehealth visit product
UPDATE public.products
   SET telehealth_addon_available = true
 WHERE requires_consultation = false
   AND category <> 'telehealth_visit'
   AND telehealth_addon_available = false;
