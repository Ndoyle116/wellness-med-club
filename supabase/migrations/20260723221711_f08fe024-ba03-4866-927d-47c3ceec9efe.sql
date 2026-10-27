
-- 1. Thyroid panel
UPDATE public.products
   SET name = 'Thyroid Panel',
       price_cents = 12000,
       description = 'T3 Uptake, T4 (Thyroxine) Total, Free T4 Index (T7), TSH.'
 WHERE slug = 'lab-thyroid-comprehensive';

-- 2. TRT monitoring panel
UPDATE public.products
   SET name = 'TRT Monitoring Panel',
       price_cents = 15000,
       description = 'For patients already on TRT. Includes Total Testosterone, Free Testosterone, Estradiol, PSA, and CBC. Recommended every 3 months for injections.'
 WHERE slug = 'lab-male-trt-monitoring';

-- 3. Testosterone price adjustments
UPDATE public.products SET price_cents = 18000 WHERE slug = 'hrm-testosterone-cyp-200-10ml';
UPDATE public.products SET price_cents = 14500 WHERE slug IN ('hrm-testosterone-cyp-200-5ml','hrm-testosterone-cyp-200-5ml-women');

-- 5. Deactivate Women's Basic Panel (hormones) — replaced by new comprehensive
UPDATE public.products SET active = false WHERE slug = 'lab-womens-hormone-nutritional';

-- 6. Reactivate Female Fertility Panel
UPDATE public.products SET active = true WHERE slug = 'lab-female-fertility';

-- Rename existing women's HRT monitoring for clarity
UPDATE public.products
   SET name = 'HRT Monitoring Panel (Women)',
       description = 'For women already on HRT with a baseline panel completed. Includes Total/Free Testosterone, CBC, Estradiol, SHBG. Every 3 months for injections, 6 months for troches/creams.'
 WHERE slug = 'lab-womens-hrt-monitoring';

-- 4. New baseline HRT panel for women
INSERT INTO public.products (slug, name, category, description, price_cents, active, pharmacy)
VALUES (
  'lab-female-hrt-baseline',
  'Comprehensive HRT Panel (Baseline, Women)',
  'lab_panel',
  'Baseline HRT panel for women still cycling. Includes DHEA-S, Progesterone, FSH/LH, HCG (urine), Total/Free Testosterone, SHBG, CBC, and CMP.',
  19000, true, NULL
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents, active = true;

-- 7. Female Comprehensive Panel (no hormones)
INSERT INTO public.products (slug, name, category, description, price_cents, active, pharmacy)
VALUES (
  'lab-female-comprehensive',
  'Female Comprehensive Panel',
  'lab_panel',
  'CBC, CMP, Fasting Glucose, A1c, Thyroid Panel, Vitamin D, B12, Folate, Lipid Panel. Hormones not included.',
  17000, true, NULL
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents, active = true;

-- 8. Female Comprehensive Panel + Hormones
INSERT INTO public.products (slug, name, category, description, price_cents, active, pharmacy)
VALUES (
  'lab-female-comprehensive-plus-hormones',
  'Female Comprehensive Panel + Hormones',
  'lab_panel',
  'CBC, CMP, Fasting Glucose, A1c, Thyroid Panel, Vitamin D, B12, Folate, Lipid Panel, Total/Free Testosterone, SHBG, Estradiol, FSH/LH, DHEA-S, Ferritin and Iron Panel.',
  27500, true, NULL
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents, active = true;

-- 9. Male Comprehensive Panel (no hormones)
INSERT INTO public.products (slug, name, category, description, price_cents, active, pharmacy)
VALUES (
  'lab-male-comprehensive',
  'Male Comprehensive Panel',
  'lab_panel',
  'CBC, CMP, Fasting Glucose, A1c, Thyroid Panel, Vitamin D, B12, Folate, PSA, Lipid Panel. Hormones not included.',
  18500, true, NULL
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents, active = true;

-- 10. Male Comprehensive Panel + Hormones
INSERT INTO public.products (slug, name, category, description, price_cents, active, pharmacy)
VALUES (
  'lab-male-comprehensive-plus-hormones',
  'Male Comprehensive Panel + Hormones',
  'lab_panel',
  'CBC, CMP, Fasting Glucose, A1c, Thyroid Panel, Vitamin D, B12, Folate, PSA, Lipid Panel, Total/Free Testosterone, Estradiol, DHEA-S, SHBG, Ferritin and Iron Panel.',
  27500, true, NULL
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents, active = true;

-- Pregnancy/Fertility consent — required for all patients
INSERT INTO public.consent_templates (slug, title, body, version, scope, active)
VALUES (
  'pregnancy-fertility-consent',
  'Pregnancy, Fertility & Contraception Acknowledgment',
  E'I acknowledge that I have been informed that certain medications, peptides, supplements, and hormone therapies prescribed or dispensed through Wellness Med Club may pose risks to a pregnancy, an unborn child, or reproductive health. I understand that the effects of some therapies on fertility, conception, pregnancy, or fetal development may not be fully known.\n\nI certify that I am not currently pregnant (if applicable), am not actively attempting to conceive or father a child, and will use appropriate and reliable contraception, when applicable, throughout the course of treatment if pregnancy is possible.\n\nI understand that it is my responsibility to immediately notify Wellness Med Club if:\n\n• I become pregnant or suspect I may be pregnant.\n• My partner becomes pregnant while I am receiving treatment that may pose a reproductive risk.\n• I discontinue contraception while pregnancy is possible.\n• I begin attempting to conceive or father a child.\n\nI understand that Wellness Med Club may recommend discontinuing or modifying treatment if pregnancy is confirmed or planned. I agree to follow the medical advice provided regarding the continuation or discontinuation of therapy.\n\nBy signing below, I acknowledge that I have been educated regarding the potential reproductive and pregnancy-related risks associated with my treatment. I understand that I am responsible for informing Wellness Med Club of any changes to my pregnancy status, reproductive plans, or contraceptive use.\n\nTo the fullest extent permitted by applicable law, I release and hold harmless Wellness Med Club, its owners, medical providers, employees, contractors, and affiliated pharmacies from liability for pregnancy-related complications, fetal harm, congenital abnormalities, birth defects, miscarriage, infertility, or other reproductive outcomes arising from my failure to disclose a pregnancy, my failure to use appropriate contraception when advised, my failure to disclose an intent to conceive or father a child, or my failure to follow medical recommendations regarding treatment.\n\nI certify that I have read and understand this acknowledgment, have had the opportunity to ask questions, and voluntarily consent to treatment under these terms.',
  1,
  'always_required',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, body = EXCLUDED.body, active = true, scope = 'always_required';
