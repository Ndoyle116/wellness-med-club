DELETE FROM public.product_consents WHERE consent_slug = 'non-fda-consent';
UPDATE public.consent_templates SET active = false WHERE slug = 'non-fda-consent';