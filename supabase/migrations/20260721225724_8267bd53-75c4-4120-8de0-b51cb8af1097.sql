
-- Reclassify products
UPDATE public.products SET category = 'vitamins'::product_category
 WHERE slug IN ('rx-minoxidil-25-30','rx-minoxidil-25-60','rx-ondansetron-4-30');

UPDATE public.products SET category = 'dermatology'::product_category
 WHERE slug LIKE 'skin-copper-%' OR slug LIKE 'hair-biotin-%';

UPDATE public.products SET category = 'intimacy'::product_category
 WHERE slug IN ('intim-climax-cream','intim-euphoria-cream','intim-scream-cream');

-- Remove supply-kit add-on from oral / topical / patch / troche products
UPDATE public.products
   SET supplies_available = false,
       supplies_price_cents = 0
 WHERE (name ILIKE '%capsule%'
        OR name ILIKE '%tablet%'
        OR name ILIKE '%troche%'
        OR name ILIKE '%patch%');
