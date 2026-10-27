-- 1. Sermorelin
UPDATE public.products
SET name = 'Sermorelin 0.9 mg/mL — 10 mL (Already Reconstituted)',
    price_cents = 24000,
    supplies_available = true,
    supplies_price_cents = 2500
WHERE slug = 'pep-sermorelin-09-10ml';

INSERT INTO public.products (slug, name, category, description, price_cents, requires_labs, requires_consultation, is_controlled, active, supplies_available, supplies_price_cents, bac_water_available, bac_water_price_cents)
VALUES
 ('pep-sermorelin-lyo-6mg','Sermorelin 6 mg Lyophilized Powder (Not Reconstituted)','peptides','Lyophilized sermorelin requiring reconstitution with bacteriostatic water.',19000,false,false,false,true,true,2500,true,2500),
 ('pep-sermorelin-lyo-9mg','Sermorelin 9 mg Lyophilized Powder (Not Reconstituted)','peptides','Lyophilized sermorelin requiring reconstitution with bacteriostatic water.',21000,false,false,false,true,true,2500,true,2500),
 ('pep-sermorelin-lyo-15mg','Sermorelin 15 mg Lyophilized Powder (Not Reconstituted)','peptides','Lyophilized sermorelin requiring reconstitution with bacteriostatic water.',24800,false,false,false,true,true,2500,true,2500)
ON CONFLICT (slug) DO NOTHING;

-- 2. NAD+
UPDATE public.products
SET name = 'NAD+ 200 mg/mL — 5 mL Vial (Ready to Use)'
WHERE slug = 'inj-nad-200-5ml';

INSERT INTO public.products (slug, name, category, description, price_cents, requires_labs, requires_consultation, is_controlled, active, supplies_available, supplies_price_cents, bac_water_available, bac_water_price_cents)
VALUES
 ('inj-nad-200-10ml','NAD+ 200 mg/mL — 10 mL Vial (Ready to Use)','peptides','Ready-to-use NAD+ multi-dose vial.',24000,false,false,false,true,true,2500,false,2500),
 ('inj-nad-lyo-500','NAD+ 500 mg Lyophilized Powder (Not Reconstituted)','peptides','Lyophilized NAD+ requiring reconstitution with bacteriostatic water.',17500,false,false,false,true,true,2500,true,2500)
ON CONFLICT (slug) DO NOTHING;

-- 3. hCG
INSERT INTO public.products (slug, name, category, description, price_cents, requires_labs, requires_consultation, is_controlled, active, supplies_available, supplies_price_cents, bac_water_available, bac_water_price_cents)
VALUES
 ('hrm-hcg-10000','Human Chorionic Gonadotropin (hCG) 10,000 IU — Lyophilized Powder','hormone_trt','Often prescribed alongside testosterone therapy for fertility preservation.',33500,true,true,false,true,true,2500,true,2500)
ON CONFLICT (slug) DO NOTHING;

-- 5. Estradiol oral tablets
INSERT INTO public.products (slug, name, category, description, price_cents, requires_labs, requires_consultation, is_controlled, active, purchase_ack_text)
VALUES
 ('hrm-estradiol-oral-1-30','Estradiol 1 mg Oral Tablets — 30-day supply','hormone_trt','Oral estradiol tablets.',11700,false,false,false,true,'I confirm that I am currently taking progesterone, am purchasing progesterone through Wellness Med Club, or have had a hysterectomy. Estradiol will not be prescribed without appropriate progesterone therapy for patients with an intact uterus unless medically contraindicated.'),
 ('hrm-estradiol-oral-1-60','Estradiol 1 mg Oral Tablets — 60-day supply','hormone_trt','Oral estradiol tablets.',16300,false,false,false,true,'I confirm that I am currently taking progesterone, am purchasing progesterone through Wellness Med Club, or have had a hysterectomy. Estradiol will not be prescribed without appropriate progesterone therapy for patients with an intact uterus unless medically contraindicated.'),
 ('hrm-estradiol-oral-2-30','Estradiol 2 mg Oral Tablets — 30-day supply','hormone_trt','Oral estradiol tablets.',11700,false,false,false,true,'I confirm that I am currently taking progesterone, am purchasing progesterone through Wellness Med Club, or have had a hysterectomy. Estradiol will not be prescribed without appropriate progesterone therapy for patients with an intact uterus unless medically contraindicated.'),
 ('hrm-estradiol-oral-2-60','Estradiol 2 mg Oral Tablets — 60-day supply','hormone_trt','Oral estradiol tablets.',16300,false,false,false,true,'I confirm that I am currently taking progesterone, am purchasing progesterone through Wellness Med Club, or have had a hysterectomy. Estradiol will not be prescribed without appropriate progesterone therapy for patients with an intact uterus unless medically contraindicated.')
ON CONFLICT (slug) DO NOTHING;

-- 8. Lipolean (MIC/B12) — supplies included
INSERT INTO public.products (slug, name, category, description, price_cents, requires_labs, requires_consultation, is_controlled, active, supplies_available)
VALUES
 ('vit-lipolean-mic-b12','Lipolean (MIC-B12) — Methionine / Inositol / Choline Chloride / Cyanocobalamin','vitamins','Lipotropic injection. Supplies included.',15000,false,false,false,true,false)
ON CONFLICT (slug) DO NOTHING;

-- 9. DHEA IR
INSERT INTO public.products (slug, name, category, description, price_cents, requires_labs, requires_consultation, is_controlled, active)
VALUES
 ('hrm-dhea-ir-10-60','DHEA Immediate Release 10 mg — 60 Capsules','hormone_trt','Immediate-release DHEA.',11000,false,false,false,true),
 ('hrm-dhea-ir-75-60','DHEA Immediate Release 75 mg — 60 Capsules','hormone_trt','Immediate-release DHEA.',17500,false,false,false,true)
ON CONFLICT (slug) DO NOTHING;

-- 10. Anastrozole
INSERT INTO public.products (slug, name, category, description, price_cents, requires_labs, requires_consultation, is_controlled, active, purchase_ack_text)
VALUES
 ('hrm-anastrozole-025-16','Anastrozole 0.25 mg — 16 Capsules','hormone_trt','Approximately a 2-month course for patients on testosterone therapy.',11000,false,false,false,true,'I confirm that I am currently on testosterone treatment.'),
 ('hrm-anastrozole-05-16','Anastrozole 0.5 mg — 16 Capsules','hormone_trt','Approximately a 2-month course for patients on testosterone therapy.',11000,false,false,false,true,'I confirm that I am currently on testosterone treatment.')
ON CONFLICT (slug) DO NOTHING;

-- 11. Omega-3
INSERT INTO public.products (slug, name, category, description, price_cents, requires_labs, requires_consultation, is_controlled, active)
VALUES
 ('vit-omega3-rx-1000-60','Omega-3 Acid Ethyl Esters (Prescription) 1,000 mg — 60 Capsules','vitamins','Recommended for patients with elevated triglycerides.',11000,false,false,false,true),
 ('vit-omega3-fish-1000-60','Omega-3 Fish Oil 1,000 mg — 60 Capsules','vitamins','Daily omega-3 support.',12400,false,false,false,true)
ON CONFLICT (slug) DO NOTHING;

-- 12. Cyanocobalamin vial options
UPDATE public.products
SET name = 'Cyanocobalamin (Vitamin B12) — 10 mL Multi-Dose Vial'
WHERE slug = 'vit-b12-cyano-10ml';

INSERT INTO public.products (slug, name, category, description, price_cents, requires_labs, requires_consultation, is_controlled, active, supplies_available, supplies_price_cents)
VALUES
 ('vit-b12-cyano-30ml','Cyanocobalamin (Vitamin B12) — 30 mL Multi-Dose Vial','vitamins','Cyanocobalamin multi-dose vial.',16000,false,false,false,true,true,2500)
ON CONFLICT (slug) DO NOTHING;

-- 13/14. Phentermine pricing
UPDATE public.products SET price_cents = 13400 WHERE slug = 'ctrl-phentermine-375-30';
UPDATE public.products SET price_cents = 19400 WHERE slug = 'ctrl-phentermine-375-60';
UPDATE public.products SET price_cents = 16000 WHERE slug = 'ctrl-phen-topiramate-30';
UPDATE public.products SET price_cents = 22100 WHERE slug = 'ctrl-phen-topiramate-60';

-- 15. Lipo Burn
INSERT INTO public.products (slug, name, category, description, price_cents, requires_labs, requires_consultation, is_controlled, active, requires_appointment, repeat_labs_interval, refill_note)
VALUES
 ('ctrl-lipo-burn-3-30','Lipo Burn 3 (Caffeine / Phentermine 20 mg / Naltrexone / Methylcobalamin) — 30-day supply','controlled','100 / 20 / 8 / 1 mg.',15300,true,true,true,true,true,'Every 6 months','Initial telehealth visit required; follow-up every 90 days.'),
 ('ctrl-lipo-burn-3-60','Lipo Burn 3 (Caffeine / Phentermine 20 mg / Naltrexone / Methylcobalamin) — 60-day supply','controlled','100 / 20 / 8 / 1 mg.',21000,true,true,true,true,true,'Every 6 months','Initial telehealth visit required; follow-up every 90 days.'),
 ('ctrl-lipo-burn-4-30','Lipo Burn 4 (Caffeine / Phentermine 37.5 mg / Naltrexone / Methylcobalamin) — 30-day supply','controlled','100 / 37.5 / 8 / 1 mg.',15300,true,true,true,true,true,'Every 6 months','Initial telehealth visit required; follow-up every 90 days.'),
 ('ctrl-lipo-burn-4-60','Lipo Burn 4 (Caffeine / Phentermine 37.5 mg / Naltrexone / Methylcobalamin) — 60-day supply','controlled','100 / 37.5 / 8 / 1 mg.',21000,true,true,true,true,true,'Every 6 months','Initial telehealth visit required; follow-up every 90 days.')
ON CONFLICT (slug) DO NOTHING;

-- 16. Hair loss 60-day pricing
UPDATE public.products SET price_cents = 20000 WHERE slug IN ('hair-biotin-min-60','hair-biotin-fin-min-60');

-- Bundles
INSERT INTO public.products (slug, name, category, description, price_cents, requires_labs, requires_consultation, is_controlled, active, requires_appointment, supplies_available, supplies_price_cents, bac_water_available, bac_water_price_cents, purchase_ack_text, repeat_labs_interval, refill_note)
VALUES
 ('bundle-nad500-sermorelin9','Bundle #1 — NAD+ 500 mg Lyophilized + Sermorelin 9 mg Lyophilized','bundle','NAD+ 500 mg lyophilized vial and Sermorelin 9 mg lyophilized vial. Supplies not included.',30000,false,false,false,true,false,true,2500,true,2500,NULL,NULL,NULL),
 ('bundle-nad100-sermorelin09','Bundle #2 — NAD+ 100 mg/mL 10 mL + Sermorelin 0.9 mg/mL 10 mL','bundle','NAD+ 100 mg/mL 10 mL vial and pre-mixed Sermorelin 0.9 mg/mL 10 mL vial. Supplies not included.',32500,false,false,false,true,false,true,2500,false,2500,NULL,NULL,NULL),
 ('bundle-menopause-starter','Bundle #3 — Menopause Starter Bundle','bundle','Estradiol Patch 0.0375 mg/day (8 patches) and Progesterone 100 mg capsules (30-day supply).',26000,false,false,false,true,false,false,2500,false,2500,NULL,NULL,NULL),
 ('bundle-estradiol-progesterone','Bundle #4 — Estradiol 2 mg + Progesterone 100 mg','bundle','Estradiol 2 mg oral tablets and Progesterone 100 mg capsules, 30-day supply.',20000,false,false,false,true,false,false,2500,false,2500,'I confirm that I am taking progesterone as part of this bundle or have had a hysterectomy.',NULL,NULL),
 ('bundle-mens-trt-starter','Bundle #5 — Men''s TRT Starter Bundle','bundle','Testosterone Cypionate 200 mg/mL 10 mL vial and Anastrozole 0.25 mg (16 capsules, ~2-month treatment). Supplies not included.',21500,true,true,true,true,true,true,2500,false,2500,NULL,'Every 6 months','Telehealth visit required; labs required before dispensing.'),
 ('bundle-testosterone-fertility','Bundle #6 — Testosterone + Fertility Preservation Bundle','bundle','Testosterone Cypionate 200 mg/mL 5 mL vial and hCG 10,000 IU lyophilized. 5–6 week treatment. Supplies not included.',37500,true,true,true,true,true,true,2500,true,2500,NULL,'Every 6 months','Initial telehealth visit; follow-up every 90 days.'),
 ('bundle-immune-support','Bundle #7 — Immune Support Bundle','bundle','Tri-Immune 30 mL vial and Methylcobalamin (B12) 10 mL vial. Supplies not included.',31000,false,false,false,true,false,true,2500,false,2500,NULL,NULL,NULL),
 ('bundle-womens-hrt','Bundle #8 — Women''s HRT Bundle','bundle','Testosterone Troches 5 mg, Estradiol 2 mg oral tablets, and Progesterone 100 mg daily. 30-day supply.',20700,true,true,true,true,true,false,2500,false,2500,'I confirm that I am taking progesterone as part of this bundle or have had a hysterectomy.','Within 6 months','Initial telehealth visit; follow-up every 90 days.'),
 ('bundle-heart-health','Bundle #9 — Heart Health Bundle','bundle','CoQ10 200 mg and Omega-3 Fish Oil 1,000 mg. 60-day supply.',15500,false,false,false,true,false,false,2500,false,2500,NULL,NULL,NULL)
ON CONFLICT (slug) DO NOTHING;

-- 17. Consents
INSERT INTO public.consent_templates (slug, title, body, version, active, scope, applies_to)
VALUES ('ed-consent','Erectile Dysfunction Informed Consent',
'I understand that medications prescribed for erectile dysfunction (including sildenafil, tadalafil, and rapid dissolve tablet combinations) carry risks including headache, flushing, nasal congestion, visual changes, low blood pressure, and, rarely, priapism (a prolonged erection lasting more than four hours) which is a medical emergency. I confirm that I am not taking nitrates or nitric-oxide donors in any form, and I will notify the practice before starting any new medication. I understand these medications do not protect against sexually transmitted infections. I have disclosed my full medical history, including any cardiac disease, and I agree to seek emergency care for chest pain, fainting, sudden vision or hearing loss, or a prolonged erection.',
1, true, 'per_product', 'erectile_dysfunction')
ON CONFLICT (slug) DO UPDATE SET active = true;

-- General informed consent / telehealth agreement required for every patient
UPDATE public.consent_templates SET scope = 'always_required' WHERE slug = 'telehealth-consent';

-- HRT consent: DHEA, progesterone, estradiol (all forms), testosterone for women
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT id, 'hrt-consent' FROM public.products
WHERE slug LIKE 'hrm-dhea%'
   OR slug LIKE 'hrm-progesterone%'
   OR slug LIKE 'hrm-estradiol%'
   OR slug LIKE 'hrm-estrogen%'
   OR slug IN ('hrm-testosterone-troche-5','hrm-testosterone-troche-10','hrm-testosterone-vaginal-cream',
               'hrm-testosterone-cyp-50-5ml-women','hrm-testosterone-cyp-100-5ml-women',
               'bundle-menopause-starter','bundle-estradiol-progesterone','bundle-womens-hrt')
ON CONFLICT DO NOTHING;

-- TRT consent: testosterone (male forms), anastrozole, hCG
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT id, 'trt-consent' FROM public.products
WHERE slug IN ('hrm-testosterone-cyp-200-5ml','hrm-testosterone-cyp-200-10ml','hrm-hcg-10000',
               'hrm-anastrozole-025-16','hrm-anastrozole-05-16',
               'bundle-mens-trt-starter','bundle-testosterone-fertility')
   OR slug LIKE 'hrm-testosterone-cream%'
   OR slug LIKE 'intim-testosterone%'
ON CONFLICT DO NOTHING;

-- GLP-1 & Phentermine consent
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT id, 'glp1-consent' FROM public.products
WHERE slug LIKE 'glp-%'
   OR slug LIKE 'ctrl-phentermine%'
   OR slug LIKE 'ctrl-phen-topiramate%'
   OR slug LIKE 'ctrl-lipo-burn%'
ON CONFLICT DO NOTHING;

-- Controlled substance consent for weight-loss controlled items and TRT bundles
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT id, 'controlled-substance-consent' FROM public.products
WHERE slug LIKE 'ctrl-lipo-burn%'
   OR slug IN ('bundle-mens-trt-starter','bundle-womens-hrt','bundle-testosterone-fertility')
ON CONFLICT DO NOTHING;

-- Erectile dysfunction consent
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT id, 'ed-consent' FROM public.products WHERE category = 'erectile_dysfunction'
ON CONFLICT DO NOTHING;

-- Peptide consent for new peptide items
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT id, 'peptide-therapy-general' FROM public.products
WHERE slug IN ('pep-sermorelin-lyo-6mg','pep-sermorelin-lyo-9mg','pep-sermorelin-lyo-15mg',
               'inj-nad-200-10ml','inj-nad-lyo-500','bundle-nad500-sermorelin9','bundle-nad100-sermorelin09')
ON CONFLICT DO NOTHING;