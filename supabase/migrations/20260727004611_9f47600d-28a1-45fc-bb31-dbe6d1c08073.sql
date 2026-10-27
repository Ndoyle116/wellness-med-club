
-- 1. Move Minoxidil tablets to Dermatology
UPDATE public.products SET category = 'dermatology' WHERE slug IN ('rx-minoxidil-25-30','rx-minoxidil-25-60');

-- 2. Correct copper peptide pricing
UPDATE public.products SET price_cents = 15000 WHERE slug = 'skin-copper-05';
UPDATE public.products SET price_cents = 18500 WHERE slug = 'skin-copper-2';
UPDATE public.products SET price_cents = 20000 WHERE slug = 'skin-copper-4';

-- 3. Erectile dysfunction products
INSERT INTO public.products (slug, name, category, description, intended_use, risks, price_cents, requires_labs, requires_consultation, is_controlled, requires_appointment, active)
VALUES
('ed-sil-tad-rdt-10', 'Sildenafil 100 mg / Tadalafil 40 mg Rapid Dissolve Tablets — 10 Tablets', 'erectile_dysfunction',
 'Combines two proven PDE-5 inhibitors in one rapid dissolve tablet for both shorter-acting and longer-acting erectile support.',
 'Take as prescribed. Do not exceed one dose within a 24-hour period unless otherwise directed by your provider.',
 'Prescription only. Do not use with nitrates or recreational "poppers" — the combination can cause a dangerous drop in blood pressure. Seek immediate care for an erection lasting longer than 4 hours, sudden vision loss, or sudden hearing loss. Common side effects: headache, flushing, nasal congestion, indigestion, back pain, muscle aches.',
 14500, false, true, false, false, true),
('ed-sil-tad-rdt-20', 'Sildenafil 100 mg / Tadalafil 40 mg Rapid Dissolve Tablets — 20 Tablets', 'erectile_dysfunction',
 'Combines two proven PDE-5 inhibitors in one rapid dissolve tablet for both shorter-acting and longer-acting erectile support.',
 'Take as prescribed. Do not exceed one dose within a 24-hour period unless otherwise directed by your provider.',
 'Prescription only. Do not use with nitrates or recreational "poppers". Seek immediate care for an erection lasting longer than 4 hours, sudden vision loss, or sudden hearing loss.',
 22000, false, true, false, false, true),
('ed-tadalafil-75-rdt-10', 'Tadalafil 75 mg Rapid Dissolve Tablets — 10 Tablets', 'erectile_dysfunction',
 'Long-lasting erectile support (up to approximately 36 hours in many patients) in a rapid dissolve tablet — no water required.',
 'Take as prescribed by your healthcare provider. Do not exceed one dose within a 24-hour period unless otherwise directed.',
 'Prescription only. Do not use with nitrates or "poppers". Use caution with significant heart disease, uncontrolled blood pressure, severe liver or kidney disease. Common side effects: headache, flushing, nasal congestion, indigestion, back pain, muscle aches.',
 14500, false, true, false, false, true),
('ed-tadalafil-75-rdt-20', 'Tadalafil 75 mg Rapid Dissolve Tablets — 20 Tablets', 'erectile_dysfunction',
 'Long-lasting erectile support (up to approximately 36 hours in many patients) in a rapid dissolve tablet — no water required.',
 'Take as prescribed by your healthcare provider. Do not exceed one dose within a 24-hour period unless otherwise directed.',
 'Prescription only. Do not use with nitrates or "poppers". Use caution with significant heart disease, uncontrolled blood pressure, severe liver or kidney disease.',
 22000, false, true, false, false, true),
('ed-sildenafil-25-30', 'Sildenafil 25 mg Tablets — 30 Tablets', 'erectile_dysfunction',
 'Lower-dose sildenafil option for patients who may be more sensitive to medication or require individualized dosing.',
 'Sexual stimulation is required for effectiveness. Take as prescribed by your healthcare provider.',
 'Prescription only. Do not use with nitrate medications. Tell your provider about heart disease, low blood pressure, recent stroke or heart attack, or certain eye conditions. Common side effects: headache, flushing, nasal congestion, upset stomach, dizziness, temporary vision changes.',
 14500, false, true, false, false, true)
ON CONFLICT (slug) DO NOTHING;

-- 4. Dermatology creams
INSERT INTO public.products (slug, name, category, description, intended_use, risks, price_cents, requires_labs, requires_consultation, is_controlled, requires_appointment, active)
VALUES
('derm-glow-cream-30g', 'Glow Even Skin Tone Cream — 30 g Tube', 'dermatology',
 'Kojic Acid 5%, Ascorbic Acid (Vitamin C) 2%, Hyaluronic Acid 0.5%. Brightens dull skin, reduces hyperpigmentation, melasma, and dark spots while hydrating and improving radiance.',
 'Apply as directed by your provider. Daily sunscreen use is recommended while using products containing kojic acid and vitamin C.',
 'Prescription only. May cause local irritation or increased sun sensitivity.',
 16000, false, false, false, false, true),
('derm-nad-rejuvenation-cream-30g', 'NAD+ Rejuvenation Cream — 30 g Tube', 'dermatology',
 'Supports healthy cellular energy production, improves the appearance of fine lines and wrinkles, and promotes firmer, smoother, more radiant skin.',
 'Apply as directed by your provider.',
 'Prescription only. Discontinue and contact your provider if irritation develops.',
 18500, false, false, false, false, true),
('derm-plump-cream-30g', 'Plump Anti-Aging Cream — 30 g Tube', 'dermatology',
 'Retinoic Acid 0.05% with Hyaluronic Acid 0.2%. Stimulates collagen production, encourages healthy cell turnover, and helps reduce fine lines, wrinkles, and acne scarring.',
 'Apply as directed. Introduce gradually to minimize irritation.',
 'Prescription only. Retinoic acid increases sun sensitivity — wear a broad-spectrum SPF daily. Avoid in pregnancy unless directed by your provider.',
 15000, false, false, false, false, true),
('derm-dermiracle-max-30g', 'Dermiracle Max Extreme Repair Cream — 30 g Tube', 'dermatology',
 'Hydroquinone 8%, Retinoic Acid 0.1%, Azelaic Acid 15%, Kojic Acid 4%, Hydrocortisone 1%. Targets severe hyperpigmentation, melasma, and stubborn dark spots.',
 'High-strength prescription formulation intended for short-term use under medical supervision. Daily sunscreen use is essential.',
 'Prescription only. May cause irritation, dryness, or increased sun sensitivity. Not for prolonged use without provider oversight.',
 20000, false, true, false, false, true),
('derm-mane10-spray-100ml', 'Mane 10 Leave-In Hair Spray — 100 mL Bottle', 'dermatology',
 'Minoxidil 5%, Fluocinolone 0.01%, Hyaluronic Acid 0.01%, Vitamin E 0.5%. Helps stimulate hair growth, reduce shedding, and calm scalp inflammation — ideal for thinning hair or androgenic alopecia.',
 'Apply as directed to a clean, dry scalp. Leave in and do not rinse. Consistent daily use is recommended for optimal results.',
 'Prescription only. May cause scalp irritation or unwanted facial hair growth with improper application.',
 19000, false, false, false, false, true),
('derm-tretinoin-005-20g', 'Tretinoin Cream 0.05% — 20 g Tube', 'dermatology',
 'Increases skin cell turnover, reduces fine lines and wrinkles, improves texture and tone, and helps treat acne and post-acne marks.',
 'Apply as directed, moisturize regularly, and wear broad-spectrum SPF 30+ daily.',
 'Prescription only. May cause dryness, peeling, redness, and increased sun sensitivity. Avoid use during pregnancy unless specifically directed by your provider.',
 12000, false, false, false, false, true)
ON CONFLICT (slug) DO NOTHING;

-- 5. Testosterone TopiClick creams (Intimacy)
INSERT INTO public.products (slug, name, category, description, intended_use, risks, price_cents, requires_labs, requires_consultation, is_controlled, requires_appointment, active)
VALUES
('intim-testosterone-ellage-50', 'Testosterone Cream 50 mg/mL (Ellage Base) — 30 g TopiClick®', 'intimacy',
 'Formulated for vaginal and vulvar application. Helps improve vaginal dryness and discomfort, supports healthy tissue and elasticity, and may improve libido, arousal, and sexual satisfaction.',
 'Apply exactly as prescribed using the TopiClick® dispenser. Ellage Base is intended primarily for vaginal and vulvar application.',
 'Prescription only. Do not exceed the prescribed dose. Wash hands after application and avoid skin-to-skin transfer until dry. Report acne, unwanted hair growth, voice changes, or scalp hair loss. Not recommended during pregnancy or while attempting to become pregnant.',
 16100, true, true, false, true, true),
('intim-testosterone-ellage-100', 'Testosterone Cream 100 mg/mL (Ellage Base) — 30 g TopiClick®', 'intimacy',
 'Formulated for vaginal and vulvar application. Helps improve vaginal dryness and discomfort, supports healthy tissue and elasticity, and may improve libido, arousal, and sexual satisfaction.',
 'Apply exactly as prescribed using the TopiClick® dispenser. Ellage Base is intended primarily for vaginal and vulvar application.',
 'Prescription only. Avoid skin-to-skin transfer until dry. Periodic follow-up and lab monitoring may be recommended. Not recommended during pregnancy.',
 16800, true, true, false, true, true),
('intim-testosterone-ellage-200', 'Testosterone Cream 200 mg/mL (Ellage Base) — 30 g TopiClick®', 'intimacy',
 'Formulated for vaginal and vulvar application. Helps improve vaginal dryness and discomfort, supports healthy tissue and elasticity, and may improve libido, arousal, and sexual satisfaction.',
 'Apply exactly as prescribed using the TopiClick® dispenser. Ellage Base is intended primarily for vaginal and vulvar application.',
 'Prescription only. Avoid skin-to-skin transfer until dry. Periodic follow-up and lab monitoring may be recommended. Not recommended during pregnancy.',
 17500, true, true, false, true, true),
('intim-testosterone-versa-50', 'Testosterone Cream 50 mg/mL (Versa Base) — 30 g TopiClick®', 'intimacy',
 'External transdermal application to inner thighs, upper arms, or shoulders. Supports energy, libido, lean muscle mass, mood, and body composition. Not for vaginal or vulvar use.',
 'Apply exactly as prescribed using the TopiClick® dispenser to recommended external sites only.',
 'Prescription only. Do not apply to the vagina or vulva. Wash hands after application and avoid skin-to-skin transfer until dry. Periodic follow-up and lab monitoring may be recommended. Not recommended during pregnancy.',
 16100, true, true, false, true, true),
('intim-testosterone-versa-100', 'Testosterone Cream 100 mg/mL (Versa Base) — 30 g TopiClick®', 'intimacy',
 'External transdermal application to inner thighs, upper arms, or shoulders. Supports energy, libido, lean muscle mass, mood, and body composition. Not for vaginal or vulvar use.',
 'Apply exactly as prescribed using the TopiClick® dispenser to recommended external sites only.',
 'Prescription only. Do not apply to the vagina or vulva. Periodic follow-up and lab monitoring may be recommended. Not recommended during pregnancy.',
 16800, true, true, false, true, true),
('intim-testosterone-versa-200', 'Testosterone Cream 200 mg/mL (Versa Base) — 30 g TopiClick®', 'intimacy',
 'External transdermal application to inner thighs, upper arms, or shoulders. Supports energy, libido, lean muscle mass, mood, and body composition. Not for vaginal or vulvar use.',
 'Apply exactly as prescribed using the TopiClick® dispenser to recommended external sites only.',
 'Prescription only. Do not apply to the vagina or vulva. Periodic follow-up and lab monitoring may be recommended. Not recommended during pregnancy.',
 17500, true, true, false, true, true)
ON CONFLICT (slug) DO NOTHING;
