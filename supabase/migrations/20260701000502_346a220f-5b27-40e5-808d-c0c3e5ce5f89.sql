
INSERT INTO public.consent_templates (slug, title, applies_to, body, version, active)
VALUES (
  'telehealth-general',
  'General Telehealth & Treatment Consent',
  NULL,
  'GENERAL TELEHEALTH & TREATMENT CONSENT

By signing this consent, you acknowledge and agree to the following:

1. TELEHEALTH SERVICES
You are electing to receive medical services via telehealth — an interaction with a licensed provider using video, phone, secure messaging, or asynchronous review. Telehealth may not be appropriate for every condition; in-person care may be recommended when clinically indicated.

2. LIMITATIONS
Telehealth cannot replace emergency care. If you are experiencing a medical emergency, call 911 or go to the nearest emergency room. The provider is not available for urgent or after-hours care.

3. INFORMATION YOU PROVIDE
The quality of care depends on the accuracy of the information you provide during intake and follow-up. You agree to provide truthful, complete medical history, current medications, and allergies, and to promptly update the provider of any changes.

4. PROVIDER-PATIENT RELATIONSHIP
A provider-patient relationship is established only after the provider reviews your intake and accepts you as a patient. Submitting an order does not guarantee acceptance or that any product will be prescribed or dispensed.

5. COMMUNICATION
You consent to receive service-related messages (order updates, provider notes, appointment reminders) by email and SMS at the contact information you provide. You may opt out of non-essential messages at any time.

6. PRIVACY
Your health information is handled in accordance with applicable privacy laws. Information is shared only with providers, pharmacies, and laboratories involved in your care, or as required by law.

7. FEES
You are responsible for the fees associated with the products and services you order. Consultation, product, and shipping fees are disclosed at checkout before payment. Refund policy is available on our website.

8. VOLUNTARY PARTICIPATION
Your participation is voluntary. You may withdraw consent at any time by contacting support; withdrawal does not affect care already delivered.

By signing below, you confirm you have read and understood this consent, have had the opportunity to ask questions, and agree to these terms.',
  1,
  true
)
ON CONFLICT (slug) DO NOTHING;
