UPDATE public.consent_templates
SET version = 2,
    title = 'Wellness Med Club Practice Policies',
    body = $body$# Wellness Med Club Practice Policies

## Appointment Policy
Appointments are reserved specifically for you. We ask that you arrive on time and be prepared for your scheduled visit.

## Cancellation & No-Show Policy
Appointments canceled with less than **24 hours' notice**, missed appointments ("no-shows"), or failure to attend a scheduled telehealth visit are **non-refundable**. This policy allows us to respect the time of our providers and other patients waiting for appointments.

## Rescheduling Policy
Patients may reschedule their appointment by providing **at least 24 hours' notice**. Appointments rescheduled with at least 24 hours' notice may be moved to the next available appointment without penalty.

## Late Arrival Policy
Patients arriving more than 10 minutes late may need to reschedule their appointment depending on the provider's schedule. If the appointment cannot be completed due to late arrival, it may be considered a missed appointment and will not be eligible for a refund.

## Refund Policy
All consultation fees, telehealth visit fees, administrative fees, and missed appointment fees are **non-refundable**. Prescription medications, compounded medications, supplements, peptides, and other products cannot be returned or refunded once an order has been submitted to the pharmacy or fulfilled.

## Pharmacy Orders
Once a prescription has been transmitted to the pharmacy, it cannot be canceled, modified, or refunded after processing has begun. Wellness Med Club is not responsible for pharmacy processing times, shipping delays, weather-related delays, carrier delays, or lost packages once they have been transferred to the shipping carrier.

## Communication Policy
Patients are encouraged to contact Wellness Med Club with questions regarding their treatment plan. Messages will be returned as promptly as possible during normal business hours. Response times may vary based on patient volume and weekends or holidays.

## Controlled Substance Policy
Patients prescribed controlled substances, including testosterone and phentermine, must comply with all required laboratory monitoring, follow-up appointments, and applicable state and federal regulations. Failure to complete required follow-up or laboratory testing may result in delayed refills or discontinuation of treatment.

## Respectful Conduct
Wellness Med Club is committed to providing a safe, respectful, and professional environment. Abusive, threatening, inappropriate, or disruptive behavior toward staff or providers may result in dismissal from the practice.

By scheduling an appointment and receiving services from Wellness Med Club, you acknowledge that you have read, understood, and agree to these Practice Policies.$body$,
    updated_at = now()
WHERE slug = 'practice-policies';