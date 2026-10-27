
-- Seed full menu from Wellness Med Club Master Therapy Menu.
-- Idempotent: uses INSERT ... ON CONFLICT (slug) DO UPDATE.

WITH new_products(slug, name, category, description, intended_use, price_cents,
  requires_labs, requires_consultation, is_controlled, requires_appointment) AS (VALUES
  -- INJECTABLE WELLNESS THERAPIES
  ('inj-nad-200-5ml',  'NAD+ 200 mg/mL — 5 mL Multi-Dose Vial',    'peptides'::product_category,
    'Injectable NAD+ therapy. Includes injection supplies and cold shipping. (Olympia)',
    'Supports cellular energy, mental clarity, healthy aging, recovery, and overall wellness.',
    16500, false, false, false, false),
  ('inj-nad-100-10ml', 'NAD+ 100 mg/mL — 10 mL Multi-Dose Vial',   'peptides',
    'Injectable NAD+ therapy. Cold shipping included; injection supplies sold separately. (Rush)',
    'Supports cellular energy, cognitive function, recovery, and healthy aging.',
    20500, false, false, false, false),
  ('inj-nad-nasal-100-5ml',  'NAD+ Nasal Spray 100 mg/mL — 5 mL',  'peptides',
    'Intranasal NAD+ for rapid absorption. Bottle and shipping included. (Rush)',
    'Supports cellular energy, focus, and cognitive performance.',
    16500, false, false, false, false),
  ('inj-nad-nasal-300-15ml', 'NAD+ Nasal Spray 300 mg/mL — 15 mL', 'peptides',
    'Intranasal NAD+ for rapid absorption. Bottle and shipping included. (Rush)',
    'Supports cellular energy, focus, and cognitive performance.',
    22500, false, false, false, false),
  ('inj-tri-immune-30ml', 'Tri-Immune (Vitamin C + Zinc + Glutathione) — 30 mL', 'peptides',
    'Multi-dose immune support injection. Cold shipping included; supplies sold separately. (Rush)',
    'Immune support, antioxidant protection, detoxification, and recovery.',
    23000, false, false, false, false),
  ('inj-glutathione-200-4ml',  'Glutathione 200 mg/mL — 4 mL',   'peptides',
    'Glutathione injection. Injection supplies and cold shipping included. (Olympia)',
    'Antioxidant, liver support, skin brightening, cellular repair, and immune support.',
    16500, false, false, false, false),
  ('inj-glutathione-200-30ml', 'Glutathione 200 mg/mL — 30 mL',  'peptides',
    'Glutathione multi-dose vial. Cold shipping included; supplies sold separately. (Rush)',
    'Antioxidant, liver support, skin health, cellular repair, and immune support.',
    26500, false, false, false, false),
  ('pep-sermorelin-09-10ml', 'Sermorelin 0.9 mg/mL — 10 mL',      'peptides',
    'Sermorelin multi-dose vial. Cold shipping included; supplies sold separately. (Olympia)',
    'Supports natural growth hormone production, sleep, recovery, and healthy aging.',
    22000, false, true, false, false),

  -- GLP-1 WEIGHT MANAGEMENT (Tirzepatide + Pyridoxine, per strength/size)
  ('glp-tirz-8-1ml',    'Tirzepatide + Pyridoxine 8 mg/mL — 1 mL',    'controlled',
    'Weekly subcutaneous GLP-1/GIP therapy. Supplies and cold shipping included. Weekly dose ~25 units.',
    'Weight management, appetite regulation, blood sugar and metabolic support.',
    19000, true, true, false, false),
  ('glp-tirz-125-1ml',  'Tirzepatide + Pyridoxine 12.5 mg/mL — 1 mL', 'controlled',
    'Weekly subcutaneous GLP-1/GIP therapy. Weekly dose ~25 units.',
    'Weight management, appetite regulation, blood sugar and metabolic support.',
    25000, true, true, false, false),
  ('glp-tirz-125-2ml',  'Tirzepatide + Pyridoxine 12.5 mg/mL — 2 mL', 'controlled',
    'Weekly subcutaneous GLP-1/GIP therapy. Weekly dose ~50 units.',
    'Weight management, appetite regulation, blood sugar and metabolic support.',
    30000, true, true, false, false),
  ('glp-tirz-125-3ml',  'Tirzepatide + Pyridoxine 12.5 mg/mL — 3 mL', 'controlled',
    'Weekly subcutaneous GLP-1/GIP therapy. Weekly dose ~75 units.',
    'Weight management, appetite regulation, blood sugar and metabolic support.',
    35000, true, true, false, false),
  ('glp-tirz-125-4ml',  'Tirzepatide + Pyridoxine 12.5 mg/mL — 4 mL', 'controlled',
    'Weekly subcutaneous GLP-1/GIP therapy. Weekly dose ~100 units.',
    'Weight management, appetite regulation, blood sugar and metabolic support.',
    40000, true, true, false, false),
  ('glp-tirz-20-3ml',   'Tirzepatide + Pyridoxine 20 mg/mL — 3 mL',   'controlled',
    'Weekly subcutaneous GLP-1/GIP therapy. Weekly dose ~75 units.',
    'Weight management, appetite regulation, blood sugar and metabolic support.',
    52500, true, true, false, false),

  ('glp-sema-125-1ml', 'Semaglutide + Pyridoxine 1.25 mg / 10 mg/mL — 1 mL', 'controlled',
    'Weekly subcutaneous GLP-1 therapy. Weekly dose ~25 units. (Rush)',
    'Appetite control, fat loss, and blood sugar regulation.',
    17500, true, true, false, false),
  ('glp-sema-25-1ml',  'Semaglutide + Pyridoxine 2.5 mg / 10 mg/mL — 1 mL',  'controlled',
    'Weekly subcutaneous GLP-1 therapy. Weekly dose ~25 units. (Rush)',
    'Appetite control, fat loss, and blood sugar regulation.',
    22000, true, true, false, false),
  ('glp-sema-25-2ml',  'Semaglutide + Pyridoxine 2.5 mg / 10 mg/mL — 2 mL',  'controlled',
    'Weekly subcutaneous GLP-1 therapy. Weekly dose ~50 units. (Rush)',
    'Appetite control, fat loss, and blood sugar regulation.',
    24000, true, true, false, false),
  ('glp-sema-25-3ml',  'Semaglutide + Pyridoxine 2.5 mg / 10 mg/mL — 3 mL',  'controlled',
    'Weekly subcutaneous GLP-1 therapy. Weekly dose ~75 units. (Rush)',
    'Appetite control, fat loss, and blood sugar regulation.',
    26000, true, true, false, false),
  ('glp-sema-25-4ml',  'Semaglutide + Pyridoxine 2.5 mg / 10 mg/mL — 4 mL',  'controlled',
    'Weekly subcutaneous GLP-1 therapy. Weekly dose ~100 units. (Rush)',
    'Appetite control, fat loss, and blood sugar regulation.',
    28000, true, true, false, false),
  ('glp-sema-75-4ml',  'Semaglutide + Pyridoxine 7.5 mg / 10 mg/mL — 4 mL',  'controlled',
    'Weekly subcutaneous GLP-1 therapy. Weekly dose ~100 units. (Rush)',
    'Appetite control, fat loss, and blood sugar regulation.',
    35000, true, true, false, false),

  -- VITAMIN D3 / B12 / B-Complex
  ('vit-d3-50k-caps',  'Vitamin D3 50,000 IU — 12 Capsules',  'vitamins',
    'Weekly oral vitamin D3 for up to 12 weeks. (Rush)',
    'Supports bone, immune, muscle, mood, and energy in deficient patients.',
    10000, true, false, false, false),
  ('vit-d3-50k-inj',   'Vitamin D3 Injectable 50,000 IU/mL',  'vitamins',
    'Weekly IM vitamin D3 injection for 12 weeks. Cold shipping included; supplies separate. (Rush)',
    'Restores healthy vitamin D levels; supports bone, immune, and muscle health.',
    21000, true, false, false, false),
  ('vit-b12-cyano-10ml', 'Cyanocobalamin (Vitamin B12) — 10 mL Multi-Dose Vial', 'vitamins',
    'Injectable B12 (cyanocobalamin). Injection supplies and cold shipping included. (Rush)',
    'Energy, red blood cell formation, nervous system, and metabolism support.',
    12000, true, false, false, false),
  ('vit-b12-methyl-10ml', 'Methylcobalamin (Vitamin B12) — 10 mL Multi-Dose Vial', 'vitamins',
    'Injectable methylated B12. Cold shipping included; supplies separate. (Olympia)',
    'Energy, nerve health, cognition, and metabolism support.',
    14500, true, false, false, false),
  ('vit-b-complex-inj-30ml', 'Vitamin B-Complex Injection — 30 mL Multi-Dose Vial', 'vitamins',
    'B1/B2/B3/B5/B6 blend injection. Cold shipping included; supplies separate.',
    'Energy, metabolism, nervous system, red blood cell production, and cognitive support.',
    19500, false, false, false, false),

  -- HORMONE OPTIMIZATION (Women unless noted)
  ('hrm-progesterone-100', 'Progesterone 100 mg — 30 Capsules', 'hormone_trt',
    'Oral micronized progesterone. (Rush)',
    'Hormone balance, sleep, hot flash relief, and mood support.',
    12500, true, true, false, false),
  ('hrm-progesterone-200', 'Progesterone 200 mg — 30 Capsules', 'hormone_trt',
    'Oral micronized progesterone. (Rush)',
    'Hormone balance, sleep, hot flash relief, and mood support.',
    13500, true, true, false, false),
  ('hrm-progesterone-300', 'Progesterone 300 mg — 30 Capsules', 'hormone_trt',
    'Oral micronized progesterone. (Olympia)',
    'Hormone balance, sleep, hot flash relief, and mood support.',
    14500, true, true, false, false),
  ('hrm-progesterone-400', 'Progesterone 400 mg — 30 Capsules', 'hormone_trt',
    'Oral micronized progesterone. (Olympia)',
    'Hormone balance, sleep, hot flash relief, and mood support.',
    15500, true, true, false, false),
  ('hrm-dhea-25', 'DHEA 25 mg — 60 Capsules', 'hormone_trt',
    'Oral DHEA supplementation. (Olympia)',
    'Hormone balance, energy, libido, and healthy aging.',
    11000, false, true, false, false),
  ('hrm-clomid-25-30',  'Clomiphene (Clomid) 25 mg — 30 Capsules', 'hormone_trt',
    'Supports natural testosterone production and fertility. (Olympia)',
    'Natural testosterone production, fertility, energy, libido, and lean muscle.',
    16500, true, true, false, false),
  ('hrm-clomid-25-60',  'Clomiphene (Clomid) 25 mg — 60 Capsules', 'hormone_trt',
    'Supports natural testosterone production and fertility. (Olympia)',
    'Natural testosterone production, fertility, energy, libido, and lean muscle.',
    20500, true, true, false, false),
  ('hrm-clomid-50-30',  'Clomiphene (Clomid) 50 mg — 30 Capsules', 'hormone_trt',
    'Supports natural testosterone production and fertility. (Olympia)',
    'Natural testosterone production, fertility, energy, libido, and lean muscle.',
    18000, true, true, false, false),
  ('hrm-clomid-50-60',  'Clomiphene (Clomid) 50 mg — 60 Capsules', 'hormone_trt',
    'Supports natural testosterone production and fertility. (Olympia)',
    'Natural testosterone production, fertility, energy, libido, and lean muscle.',
    22000, true, true, false, false),

  ('hrm-estrogen-patch-025', 'Estrogen Transdermal Patch 0.025 mg/day — 4-Patch Pack', 'hormone_trt',
    'Weekly / twice-weekly transdermal estrogen. (Rush)',
    'Perimenopause and menopause symptom relief; supports mood, sleep, and bone health.',
    16000, true, true, false, false),
  ('hrm-estrogen-patch-05',  'Estrogen Transdermal Patch 0.05 mg/day — 4-Patch Pack',  'hormone_trt',
    'Weekly / twice-weekly transdermal estrogen. (Rush)',
    'Perimenopause and menopause symptom relief; supports mood, sleep, and bone health.',
    16000, true, true, false, false),
  ('hrm-estrogen-patch-075', 'Estrogen Transdermal Patch 0.075 mg/day — 4-Patch Pack', 'hormone_trt',
    'Weekly / twice-weekly transdermal estrogen. (Rush)',
    'Perimenopause and menopause symptom relief; supports mood, sleep, and bone health.',
    16000, true, true, false, false),
  ('hrm-estrogen-patch-10',  'Estrogen Transdermal Patch 0.10 mg/day — 4-Patch Pack',  'hormone_trt',
    'Weekly / twice-weekly transdermal estrogen. (Rush)',
    'Perimenopause and menopause symptom relief; supports mood, sleep, and bone health.',
    16000, true, true, false, false),

  -- Men's Testosterone (variants)
  ('hrm-testosterone-cyp-200-5ml',  'Testosterone Cypionate 200 mg/mL — 5 mL Multi-Dose Vial (Men)', 'hormone_trt',
    'Weekly IM testosterone therapy. Initial telehealth consult included; supplies separate. (Olympia). Schedule III controlled substance.',
    'Testosterone replacement for clinically diagnosed low testosterone in men.',
    17000, true, true, true, true),
  ('hrm-testosterone-cyp-200-10ml', 'Testosterone Cypionate 200 mg/mL — 10 mL Multi-Dose Vial (Men)', 'hormone_trt',
    'Weekly IM testosterone therapy. Initial telehealth consult and supplies included. (Rush). Schedule III controlled substance.',
    'Testosterone replacement for clinically diagnosed low testosterone in men.',
    22000, true, true, true, true),

  -- Women's Testosterone Vaginal Cream
  ('hrm-testosterone-vaginal-cream', 'Testosterone Vaginal Cream (Women)', 'hormone_trt',
    'Twice-weekly application. Initial telehealth consult included; supplies separate. Schedule III controlled substance.',
    'Supports libido, energy, mood, and quality of life for peri/menopausal women with testosterone deficiency.',
    19500, true, true, true, true),

  -- MEDICAL WEIGHT MANAGEMENT — Phentermine variants
  ('ctrl-phentermine-375-30', 'Phentermine 37.5 mg — 30 Capsules', 'controlled',
    'Includes initial 15-minute telehealth consultation. Schedule IV controlled substance.',
    'Appetite suppression and weight loss support alongside diet and exercise.',
    16000, false, true, true, true),
  ('ctrl-phentermine-375-60', 'Phentermine 37.5 mg — 60 Capsules', 'controlled',
    'Includes initial 15-minute telehealth consultation. Schedule IV controlled substance.',
    'Appetite suppression and weight loss support alongside diet and exercise.',
    21000, false, true, true, true),
  ('ctrl-phen-topiramate-30', 'Phentermine HCl 15 mg / Topiramate 20 mg — 30 Tablets', 'controlled',
    'Includes initial 15-minute telehealth consultation. Schedule IV controlled substance.',
    'Appetite suppression, satiety, and long-term weight management support.',
    19000, false, true, true, true),
  ('ctrl-phen-topiramate-60', 'Phentermine HCl 15 mg / Topiramate 20 mg — 60 Tablets', 'controlled',
    'Includes initial 15-minute telehealth consultation. Schedule IV controlled substance.',
    'Appetite suppression, satiety, and long-term weight management support.',
    24000, false, true, true, true),

  -- HAIR RESTORATION / SUPPORTIVE
  ('rx-minoxidil-25-30',  'Minoxidil 2.5 mg — 30 Tablets', 'non_fda',
    'Oral low-dose minoxidil for hair growth. (Rush)',
    'Hair shedding reduction and increased hair density.',
    8500, false, false, false, false),
  ('rx-minoxidil-25-60',  'Minoxidil 2.5 mg — 60 Tablets', 'non_fda',
    'Oral low-dose minoxidil for hair growth. (Rush)',
    'Hair shedding reduction and increased hair density.',
    11000, false, false, false, false),
  ('rx-ondansetron-4-30', 'Ondansetron 4 mg — 30 Tablets', 'non_fda',
    'Anti-nausea tablets, often used alongside GLP-1 therapy. (Rush)',
    'Relief of nausea and vomiting; supports tolerance to GLP-1 medications.',
    9000, false, false, false, false),

  -- COPPER PEPTIDE SKIN CARE
  ('skin-copper-05', 'Copper Peptide Cream 0.5% — 30 g Tube', 'non_fda',
    'Topical copper peptide cream for daily skin care. (Olympia)',
    'Collagen support, improved skin texture and tone.',
    15000, false, false, false, false),
  ('skin-copper-2',  'Copper Peptide Cream 2% — 30 g Tube',   'non_fda',
    'Topical copper peptide cream for daily skin care. (Olympia)',
    'Collagen support, improved skin elasticity and texture.',
    20000, false, false, false, false),
  ('skin-copper-4',  'Copper Peptide Cream 4% — 30 g Tube',   'non_fda',
    'Topical copper peptide cream for daily skin care. (Olympia)',
    'Advanced collagen support, skin firmness, and rejuvenation.',
    23000, false, false, false, false),

  -- INTIMATE WELLNESS
  ('intim-climax-cream',   'Climax Cream',   'non_fda',
    'Compounded topical (Theophylline 3% / Arginine 3% / Ergoloid Mesylate 0.05% / Pentoxifylline 5%). (Olympia)',
    'Enhanced blood flow, arousal, sensitivity, and sexual response.',
    19000, false, false, false, false),
  ('intim-scream-cream',   'Scream Cream',   'non_fda',
    'Compounded topical (Theophylline 3% / Arginine 6% / Sildenafil 2%). (Olympia)',
    'Enhanced blood flow, sensation, and arousal.',
    19000, false, false, false, false),
  ('intim-euphoria-cream', 'Euphoria Cream', 'non_fda',
    'Compounded topical for female intimate wellness. (Olympia)',
    'Supports arousal, genital sensation, blood flow, and lubrication.',
    20000, false, false, false, false)
)
INSERT INTO public.products
  (slug, name, category, description, intended_use, price_cents,
   requires_labs, requires_consultation, is_controlled, requires_appointment, active)
SELECT slug, name, category, description, intended_use, price_cents,
   requires_labs, requires_consultation, is_controlled, requires_appointment, true
FROM new_products
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  intended_use = EXCLUDED.intended_use,
  price_cents = EXCLUDED.price_cents,
  requires_labs = EXCLUDED.requires_labs,
  requires_consultation = EXCLUDED.requires_consultation,
  is_controlled = EXCLUDED.is_controlled,
  requires_appointment = EXCLUDED.requires_appointment,
  active = true,
  updated_at = now();

-- Consent mappings ----------------------------------------------------------
-- GLP-1 consent for all Tirzepatide + Semaglutide variants
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT p.id, 'glp1-consent' FROM public.products p
WHERE p.slug LIKE 'glp-tirz-%' OR p.slug LIKE 'glp-sema-%' OR p.slug = 'ctrl-glp1-semaglutide' OR p.slug = 'ctrl-tirzepatide'
ON CONFLICT DO NOTHING;

-- HRT consent for hormone_trt products EXCEPT men's/women's testosterone (those use TRT consent)
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT p.id, 'hrt-consent' FROM public.products p
WHERE p.category = 'hormone_trt'
  AND p.slug NOT IN ('hrm-testosterone-cypionate','hrm-testosterone-cyp-200-5ml','hrm-testosterone-cyp-200-10ml','hrm-testosterone-vaginal-cream')
ON CONFLICT DO NOTHING;

-- TRT consent + Controlled Substance + Telehealth for all testosterone products
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT p.id, c FROM public.products p
CROSS JOIN (VALUES ('trt-consent'),('controlled-substance-consent'),('telehealth-consent')) AS v(c)
WHERE p.slug IN ('hrm-testosterone-cypionate','hrm-testosterone-cyp-200-5ml','hrm-testosterone-cyp-200-10ml','hrm-testosterone-vaginal-cream')
ON CONFLICT DO NOTHING;

-- Phentermine: controlled substance + telehealth (no TRT)
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT p.id, c FROM public.products p
CROSS JOIN (VALUES ('controlled-substance-consent'),('telehealth-consent')) AS v(c)
WHERE p.slug IN ('ctrl-phentermine','ctrl-phentermine-375-30','ctrl-phentermine-375-60','ctrl-phen-topiramate-30','ctrl-phen-topiramate-60')
ON CONFLICT DO NOTHING;

-- Also flag Phentermine variants correctly (already done in insert)
-- Ensure GLP products aren't marked controlled (they are compounded, not scheduled)
UPDATE public.products SET is_controlled = false, requires_appointment = false
 WHERE slug IN ('ctrl-glp1-semaglutide','ctrl-tirzepatide')
    OR slug LIKE 'glp-tirz-%' OR slug LIKE 'glp-sema-%';

-- Lab-order consent for all lab panels
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT p.id, 'lab-order-consent' FROM public.products p
WHERE p.category = 'lab_panel'
ON CONFLICT DO NOTHING;

-- Non-FDA consent for Amino Flux
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT p.id, 'non-fda-consent' FROM public.products p
WHERE p.slug = 'sup-amino-flux'
ON CONFLICT DO NOTHING;

-- Peptide therapy consent for Sermorelin + NAD injections (provider recommendation)
INSERT INTO public.product_consents (product_id, consent_slug)
SELECT p.id, 'peptide-therapy-general' FROM public.products p
WHERE p.slug IN ('pep-sermorelin-09-10ml','pep-bpc-157','pep-cjc-ipamorelin','pep-glow')
ON CONFLICT DO NOTHING;
