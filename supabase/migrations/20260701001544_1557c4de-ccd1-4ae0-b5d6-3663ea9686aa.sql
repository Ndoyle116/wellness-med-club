
INSERT INTO public.products (slug, name, category, description, intended_use, risks, price_cents, requires_labs, requires_consultation, is_controlled, requires_appointment, active)
VALUES
  ('ctrl-phentermine','Phentermine (Medical Weight Loss)','controlled',
   'Short-term appetite suppressant for medically supervised weight loss. Requires a pre-purchase provider appointment.',
   'Adjunct to a reduced-calorie diet and exercise for weight management in adults with a BMI ≥ 30 (or ≥ 27 with weight-related conditions).',
   'Elevated blood pressure and heart rate, insomnia, dry mouth, anxiety, dependence risk. Not for use with cardiovascular disease, hyperthyroidism, glaucoma, MAOI use, or pregnancy.',
   12500, true, true, true, true, true),
  ('sup-amino-flux','Amino Flux','non_fda',
   'Specialty amino acid formulation. Non-FDA-evaluated supplement.',
   'Supports recovery, performance, and cellular energy metabolism.',
   'Not evaluated by the FDA. Discuss with your provider if you take medications or have kidney disease.',
   6500, false, false, false, false, true),
  ('lab-urinalysis-reflex','Urinalysis with Reflex Culture (+ Antibiotics if Warranted)','lab_panel',
   'Urinalysis with reflex to culture. If a urinary tract infection is identified, antibiotics may be sent to your preferred pharmacy. Patient is responsible for the antibiotic cost at the pharmacy.',
   'Screening and diagnosis of suspected urinary tract infection.',
   'Antibiotic side effects vary by medication prescribed. Notify the provider of drug allergies.',
   9000, false, false, false, false, true),
  ('visit-telehealth-30','Telehealth Visit — 30 minutes','telehealth_visit',
   'A 30-minute video or phone consultation with a Wellness Med Club provider. Book a time that works for you.',
   'General wellness questions, lab review, treatment planning, follow-up care.',
   NULL,
   7500, false, true, false, true, true)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.products SET requires_appointment = true
 WHERE slug IN ('hrm-testosterone-cypionate');

UPDATE public.consent_templates SET active = false
 WHERE slug IN ('peptide-therapy-general','hormone-trt-consent','controlled-medication-consent','lab-order-personal-use','telehealth-general');

INSERT INTO public.consent_templates (slug, title, applies_to, scope, body, version, active) VALUES
  ('waiver-of-liability','Waiver of Liability', NULL, 'always_required',
   'WAIVER OF LIABILITY

[Placeholder — replace with the finalized Waiver of Liability text.]

By signing, I acknowledge that I have read and understand this waiver and agree to its terms.',
   1, true),
  ('practice-policies','Practice Policies', NULL, 'always_required',
   'PRACTICE POLICIES

[Placeholder — replace with the finalized Practice Policies text: appointment/cancellation policy, refund policy, controlled substance policies, communication expectations, etc.]

By signing, I acknowledge I have read and agree to the practice policies.',
   1, true),
  ('telehealth-consent','Telehealth Consent', NULL, 'per_product',
   'TELEHEALTH CONSENT

I understand that I am electing to receive medical services from a Wellness Med Club provider via telehealth — a synchronous video or phone visit, or asynchronous secure messaging.

I understand that telehealth cannot replace emergency care. In an emergency I will call 911 or go to the nearest emergency room.

I understand a provider-patient relationship is established only after the provider reviews my intake and accepts me as a patient. Submitting an order does not guarantee acceptance or that any medication will be prescribed.

I consent to receive service-related messages by email and SMS at the contact information I provide.

By signing, I acknowledge I have read and agree to this telehealth consent.',
   1, true),
  ('trt-consent','Testosterone Replacement Therapy (TRT) Consent', NULL, 'per_product',
   'TESTOSTERONE REPLACEMENT THERAPY (TRT) CONSENT — MEN

I understand testosterone therapy is prescribed for men with clinically documented low testosterone, based on symptoms and laboratory testing.

Benefits may include improvements in energy, libido, mood, muscle mass, and bone density. Outcomes are not guaranteed and vary by individual.

Risks and side effects include but are not limited to: elevated red blood cell count (polycythemia), acne, oily skin, fluid retention, gynecomastia, testicular shrinkage, reduced sperm production and possible infertility, sleep apnea, mood changes, and worsening of pre-existing prostate conditions. Long-term cardiovascular effects continue to be studied.

I understand I will need periodic laboratory monitoring (testosterone, estradiol, PSA, CBC) and that failure to complete required labs may result in discontinuation of therapy.

Testosterone is a controlled substance. I will not share, sell, or divert my medication.

By signing, I acknowledge I have read and agree to this TRT consent.',
   1, true),
  ('hrt-consent','Hormone Replacement Therapy (HRT) Consent', NULL, 'per_product',
   'HORMONE REPLACEMENT THERAPY (HRT) CONSENT — WOMEN

I understand hormone replacement therapy may include estrogen (oral or transdermal), progesterone, and/or low-dose testosterone, prescribed to address perimenopausal or menopausal symptoms.

Benefits may include improvement in hot flashes, night sweats, sleep, mood, libido, vaginal dryness, and bone health. Outcomes vary by individual.

Risks and side effects include but are not limited to: breast tenderness, spotting or breakthrough bleeding, headaches, mood changes, fluid retention, gallbladder disease, increased risk of blood clots and stroke (especially with oral estrogen), and — depending on formulation and personal history — potential effects on breast, endometrial, and cardiovascular risk.

I understand I will need periodic laboratory monitoring and clinical follow-up. I will notify my provider promptly of unusual bleeding, chest pain, leg swelling, or neurologic symptoms.

By signing, I acknowledge I have read and agree to this HRT consent.',
   1, true),
  ('glp1-consent','GLP-1 Medication Consent', NULL, 'per_product',
   'GLP-1 MEDICATION CONSENT (Semaglutide / Tirzepatide)

I understand GLP-1 receptor agonist medications are prescribed as an adjunct to a reduced-calorie diet and increased physical activity for weight management.

Common side effects include nausea, vomiting, diarrhea, constipation, abdominal pain, and injection-site reactions. Serious risks include pancreatitis, gallbladder disease, kidney injury from dehydration, hypoglycemia (especially when combined with insulin/sulfonylureas), and — based on animal studies — a boxed warning for thyroid C-cell tumors. This medication is not for patients with a personal or family history of medullary thyroid carcinoma or MEN 2.

I will not use this medication if I am pregnant, planning pregnancy, or breastfeeding. I will notify my provider of any planned surgery requiring anesthesia (risk of retained gastric contents).

I understand dose titration is required to reduce GI side effects and that abrupt discontinuation may lead to weight regain.

By signing, I acknowledge I have read and agree to this GLP-1 consent.',
   1, true),
  ('controlled-substance-consent','Controlled Substance Agreement', NULL, 'per_product',
   'CONTROLLED SUBSTANCE AGREEMENT

The medication I am being prescribed is a federally controlled substance. To ensure safe use I agree to the following:

1. I will use this medication only as prescribed by my Wellness Med Club provider.
2. I will not share, sell, trade, or give this medication to anyone else.
3. I will store this medication securely and out of reach of children and others.
4. I will not obtain the same or a similar controlled substance from another prescriber without notifying my provider.
5. I consent to random urine drug testing and state prescription drug monitoring program (PDMP) checks.
6. I understand lost, stolen, or damaged medication will not be replaced early.
7. I will notify my provider immediately of any adverse reaction, unusual mood change, or misuse.

Violation of this agreement may result in discontinuation of the medication and termination of the provider-patient relationship.

By signing, I acknowledge I have read and agree to this controlled substance agreement.',
   1, true),
  ('lab-order-consent','Laboratory Order Consent & Acknowledgment', NULL, 'per_product',
   'WELLNESS MED CLUB — LABORATORY ORDER CONSENT & ACKNOWLEDGMENT

PURPOSE OF LABORATORY ORDER
I understand that Wellness Med Club is providing this laboratory order solely for the purpose of obtaining blood work requested by me or recommended by my provider. The purchase of laboratory testing does not include interpretation of laboratory results, medical advice, diagnosis, or treatment recommendations.

LABORATORY ORDER PROCESSING
I understand that:
- Once my laboratory panel has been purchased, please allow up to 24 business hours for a Wellness Med Club provider to review and submit the laboratory order to Quest Diagnostics.
- Processing time does not include weekends or holidays.
- Once the order has been processed, my Quest Diagnostics laboratory requisition will be sent to the email address I provided.
- It is my responsibility to schedule an appointment with the Quest Diagnostics location of my choice to complete my laboratory testing.

LABORATORY RESULTS
I understand that:
- Laboratory results may take several days to one week to be finalized.
- I am responsible for reviewing my results with a qualified healthcare provider.
- Wellness Med Club will not automatically contact me regarding my laboratory results unless otherwise arranged.

LABORATORY INTERPRETATION
I understand that:
- If I would like a Wellness Med Club provider to review, interpret, and discuss my laboratory results, I must schedule a separate Laboratory Review Appointment.
- Laboratory review appointments are not included with the purchase of laboratory testing and are subject to an additional appointment fee.
- I may also choose to have my laboratory results interpreted by another licensed healthcare provider of my choice.
- Laboratory values should always be interpreted in the context of my medical history, symptoms, medications, and overall health.

NO MEDICAL ADVICE
I understand that:
- Purchasing laboratory testing alone does not establish a provider-patient relationship for diagnosis or ongoing medical management.
- Wellness Med Club cannot provide medical recommendations based solely on laboratory values without an appropriate medical evaluation.
- Abnormal laboratory findings may require additional testing, referral to another healthcare provider, or emergency medical evaluation depending on the results.

FINANCIAL POLICY
I understand that:
- Laboratory order fees are non-refundable once the order has been submitted.
- Any appointment to review or interpret laboratory results with a Wellness Med Club provider requires a separate appointment and additional fee.

PATIENT ACKNOWLEDGMENT
By signing below, I acknowledge that this purchase is for a laboratory order only, interpretation is not included, my Quest requisition will be emailed after processing, it is my responsibility to schedule my Quest appointment, review appointments require a separate fee, I may alternatively review results with another licensed provider, and I have had the opportunity to ask questions.',
   1, true),
  ('non-fda-consent','Non-FDA-Evaluated Product Consent', NULL, 'per_product',
   'NON-FDA-EVALUATED PRODUCT CONSENT

I understand that the product I am purchasing has not been evaluated or approved by the U.S. Food and Drug Administration (FDA) for the diagnosis, treatment, cure, or prevention of any disease.

I understand that:
- Statements about this product have not been reviewed by the FDA.
- Long-term safety data may be limited.
- Individual responses vary; benefits are not guaranteed.
- I should discuss use of this product with my personal healthcare provider, particularly if I take other medications, am pregnant or nursing, or have any chronic medical condition.

I release Wellness Med Club, its employees, and affiliates from liability for outcomes related to my elective use of this non-FDA-evaluated product to the extent permitted by law.

By signing, I acknowledge I have read and agree to this non-FDA product consent.',
   1, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_consents (product_id, consent_slug)
SELECT p.id, m.consent_slug
FROM public.products p
JOIN (VALUES
  ('hrm-testosterone-cypionate','telehealth-consent'),
  ('hrm-testosterone-cypionate','trt-consent'),
  ('hrm-testosterone-cypionate','controlled-substance-consent'),
  ('hrm-estradiol-progesterone','hrt-consent'),
  ('ctrl-phentermine','telehealth-consent'),
  ('ctrl-phentermine','controlled-substance-consent'),
  ('ctrl-glp1-semaglutide','glp1-consent'),
  ('ctrl-tirzepatide','glp1-consent'),
  ('sup-amino-flux','non-fda-consent'),
  ('visit-telehealth-30','telehealth-consent')
) AS m(product_slug, consent_slug) ON p.slug = m.product_slug
ON CONFLICT DO NOTHING;

INSERT INTO public.product_consents (product_id, consent_slug)
SELECT p.id, 'lab-order-consent'
  FROM public.products p
 WHERE p.category = 'lab_panel'
ON CONFLICT DO NOTHING;
