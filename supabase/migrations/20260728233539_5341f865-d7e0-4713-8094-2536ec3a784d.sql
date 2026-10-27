UPDATE public.consent_templates SET
  title = 'Informed Consent, Assumption of Risk, Waiver of Liability, Release Agreement, and Telehealth Consent',
  version = 3,
  active = true,
  updated_at = now(),
  body = $body$By purchasing, receiving, or participating in any products, medications, supplements, laboratory services, treatments, therapies, consultations, telehealth visits, or wellness services offered by Wellness Med Club, you acknowledge and agree to the following:

1. Voluntary Participation
I understand that my participation in any treatment, consultation, medication, supplement, peptide therapy, hormone replacement therapy (HRT), testosterone replacement therapy (TRT), weight management program, laboratory testing, IV therapy, or wellness service provided by Wellness Med Club is entirely voluntary.

2. No Guarantee of Results
I acknowledge that every individual responds differently to treatment. Wellness Med Club makes no representations, warranties, or guarantees regarding the effectiveness of any medication, product, supplement, therapy, or service, nor does it guarantee that I will achieve any specific medical, cosmetic, weight-loss, hormonal, or wellness outcome.

3. Assumption of Risk
I understand that all medications, supplements, injections, laboratory testing, peptides, hormone therapies, medical treatments, and wellness services carry potential risks, including but not limited to:
- Allergic reactions
- Side effects
- Medication intolerance
- Infection
- Bruising or bleeding
- Lack of effectiveness
- Hormonal changes
- Unexpected complications
- Serious illness or injury
- Other known and unknown risks

I voluntarily assume full responsibility for all known and unknown risks associated with my participation in Wellness Med Club services.

4. Medical History Disclosure
I certify that I have truthfully disclosed my complete medical history, current medications, allergies, prior surgeries, medical conditions, pregnancy status, and any other information that may affect my treatment.

I understand that withholding, omitting, or providing inaccurate medical information may increase my risk of complications and may affect treatment recommendations.

5. Compliance with Medical Recommendations
I agree to follow all dosing instructions, medication guidelines, laboratory monitoring schedules, follow-up appointments, and safety recommendations provided by Wellness Med Club.

I understand that failure to follow medical recommendations may increase my risk of adverse outcomes and may result in discontinuation of treatment.

6. Release of Liability
To the fullest extent permitted by applicable law, I voluntarily release, waive, and hold harmless Wellness Med Club, its owners, physicians, nurse practitioners, physician assistants, medical providers, employees, contractors, affiliates, successors, and agents from any claims, demands, damages, liabilities, or causes of action arising from my voluntary participation in services provided by Wellness Med Club, except where prohibited by law or resulting from gross negligence, reckless conduct, or intentional misconduct.

This release includes, but is not limited to:
- Expected or unexpected side effects
- Allergic or adverse reactions
- Medication complications
- Failure to achieve desired results
- Financial losses related to treatment decisions
- Injuries or damages associated with voluntary participation in treatment

7. Educational Nature of Services
I understand that Wellness Med Club provides education, wellness guidance, telehealth consultations, and treatment recommendations based upon current medical knowledge and clinical judgment.

I acknowledge that no medication, supplement, therapy, peptide, hormone treatment, or wellness service can guarantee prevention, diagnosis, improvement, or cure of any disease or medical condition.

8. Pregnancy Acknowledgment
If I am biologically capable of becoming pregnant, I certify that I am not currently pregnant unless I have specifically informed my provider.

I understand that certain medications, hormones, peptides, supplements, and weight-loss medications may pose risks during pregnancy.

I agree to notify Wellness Med Club immediately if I become pregnant or suspect I may be pregnant while undergoing treatment.

If advised by my provider, I agree to use appropriate contraception during treatment. I understand that Wellness Med Club is not responsible for pregnancy-related complications, miscarriage, fetal injury, or birth defects resulting from failure to disclose pregnancy or failure to follow contraceptive recommendations.

9. Pharmacy Processing and Shipping
I understand that Wellness Med Club utilizes independent third-party licensed pharmacies to compound and dispense prescribed medications.

Once my prescription has been transmitted to the pharmacy, Wellness Med Club has no control over:
- Prescription processing times
- Medication compounding timelines
- Inventory availability
- Manufacturing delays
- Shipping carrier performance
- Weather-related delays
- Lost, stolen, delayed, or damaged packages
- Supply shortages
- Pharmacy staffing or operational delays
- Any other circumstance outside the reasonable control of Wellness Med Club

Estimated processing and shipping times are provided solely as a courtesy and are not guaranteed.

I acknowledge that Wellness Med Club cannot be held liable for delays in prescription processing, medication availability, shipping, delivery, damaged packages, lost shipments, or any issues occurring after my prescription has been submitted to the dispensing pharmacy.

While Wellness Med Club will make reasonable efforts to assist patients whenever possible, it cannot guarantee expedited processing, shipping, replacement medications, or delivery dates.

10. Telehealth Consent
I understand that Wellness Med Club provides many of its services through telemedicine and virtual consultations. I voluntarily consent to receive healthcare services through telehealth using secure electronic communication technologies.

I acknowledge and understand that:
- Telehealth allows me to receive medical care without being physically present in the same location as my healthcare provider.
- Telemedicine has limitations, including the inability to perform a complete physical examination, and additional laboratory testing, imaging, or in-person evaluation may be recommended before treatment can continue.
- Technical failures, internet interruptions, equipment malfunctions, or electronic communication issues may delay or interrupt my visit.
- Wellness Med Club will make reasonable efforts to protect my health information in accordance with HIPAA and applicable privacy laws.
- I am responsible for providing complete and accurate medical information, including current medications, allergies, symptoms, diagnoses, and changes in my health.
- I understand that telemedicine is not appropriate for medical emergencies. In the event of an emergency, I will immediately call 911 or seek care at the nearest emergency department.
- My provider may determine that telemedicine is not appropriate for my condition and may require an in-person examination or referral to another healthcare provider before treatment is provided.

By acknowledging this agreement, I voluntarily consent to receive healthcare services through telemedicine and acknowledge that I have had the opportunity to ask questions regarding telehealth and understand its risks, benefits, and limitations.

11. Consent to Treatment
I acknowledge that I have had the opportunity to ask questions regarding my treatment, medications, laboratory testing, and recommended therapies, and that all of my questions have been answered to my satisfaction.

I understand the potential risks, benefits, alternatives, and limitations of treatment and voluntarily consent to receive services from Wellness Med Club.

12. Legal Agreement
By electronically acknowledging this agreement, I certify that:
- I have carefully read this document in its entirety.
- I fully understand its contents.
- I have had sufficient opportunity to ask questions.
- I voluntarily consent to treatment.
- I voluntarily consent to receive services through telehealth when applicable.
- I understand this agreement is intended to be legally binding to the fullest extent permitted by applicable law.
- If any provision of this agreement is determined to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.$body$
WHERE slug = 'waiver-of-liability';

UPDATE public.consent_templates SET
  version = 2,
  active = true,
  updated_at = now(),
  body = $body$I understand that Wellness Med Club provides many of its services through telemedicine and virtual consultations. I voluntarily consent to receive healthcare services through telehealth using secure electronic communication technologies.

I acknowledge and understand that:
- Telehealth allows me to receive medical care without being physically present in the same location as my healthcare provider.
- Telemedicine has limitations, including the inability to perform a complete physical examination, and additional laboratory testing, imaging, or in-person evaluation may be recommended before treatment can continue.
- Technical failures, internet interruptions, equipment malfunctions, or electronic communication issues may delay or interrupt my visit.
- Wellness Med Club will make reasonable efforts to protect my health information in accordance with HIPAA and applicable privacy laws.
- I am responsible for providing complete and accurate medical information, including current medications, allergies, symptoms, diagnoses, and changes in my health.
- Telemedicine is not appropriate for medical emergencies. In the event of an emergency, I will immediately call 911 or seek care at the nearest emergency department.
- My provider may determine that telemedicine is not appropriate for my condition and may require an in-person examination or referral to another healthcare provider before treatment is provided.

By acknowledging this agreement, I voluntarily consent to receive healthcare services through telemedicine and acknowledge that I have had the opportunity to ask questions regarding telehealth and understand its risks, benefits, and limitations.$body$
WHERE slug = 'telehealth-consent';

INSERT INTO public.product_consents (product_id, consent_slug)
SELECT p.id, 'waiver-of-liability' FROM public.products p
WHERE p.active = true
ON CONFLICT DO NOTHING;