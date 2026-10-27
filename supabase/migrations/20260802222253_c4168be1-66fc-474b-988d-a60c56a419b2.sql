WITH classed AS (
  SELECT p.id,
    CASE
      WHEN p.name ILIKE '%(women)%' OR p.slug LIKE '%-women%' THEN 'women'
      WHEN p.name ILIKE '%(men)%' OR p.slug LIKE '%-men%' OR p.slug LIKE 'bundle-mens%' THEN 'men'
      WHEN p.name ILIKE '%vaginal%' OR p.name ILIKE '%troche%' THEN 'women'
      WHEN p.name ILIKE '%estradiol%' OR p.name ILIKE '%estrogen%' OR p.name ILIKE '%progesterone%' THEN 'women'
      WHEN p.name ILIKE '%anastrozole%' OR p.name ILIKE '%hcg%' OR p.name ILIKE '%chorionic%'
        OR p.name ILIKE '%clomi%' THEN 'men'
      WHEN p.slug LIKE 'hrm-testosterone-cream-%' THEN 'women'
      ELSE NULL
    END AS gender
  FROM public.products p
)
DELETE FROM public.product_consents pc
USING classed c
WHERE pc.product_id = c.id
  AND (
    (c.gender = 'men' AND pc.consent_slug = 'hrt-consent')
    OR (c.gender = 'women' AND pc.consent_slug = 'trt-consent')
  );

WITH classed AS (
  SELECT p.id,
    CASE
      WHEN p.name ILIKE '%anastrozole%' OR p.name ILIKE '%hcg%' OR p.name ILIKE '%chorionic%'
        OR p.name ILIKE '%clomi%' THEN 'men'
      ELSE NULL
    END AS gender
  FROM public.products p
)
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT c.id, 'trt-consent' FROM classed c
WHERE c.gender = 'men'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_consents pc
    WHERE pc.product_id = c.id AND pc.consent_slug = 'trt-consent'
  )
ON CONFLICT DO NOTHING;