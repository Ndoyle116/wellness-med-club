# Membership Evaluation Checkout — Implementation Checklist

Status: **Draft / not deployed / payments disabled**. Branch: `feature/memberships-page`.

## Existing implementation verified
- `src/routes/memberships.tsx` lists four programs and prices.
- `src/routes/membership-evaluation.tsx` is an information/eligibility preview only; it does **not** save medical information, create an order, or charge a card.
- `src/routes/checkout.tsx` uses Supabase authentication, intake and consent records, and `StripeEmbeddedCheckoutForm`.
- `src/components/StripeEmbeddedCheckout.tsx` actually **redirects to Stripe-hosted Checkout**. It is not an embedded payment form despite its name.
- `src/lib/checkout.functions.ts` calls server-side checkout handlers with authentication.

## Required before connecting the $199 payment button
1. Create a dedicated, server-validated `membership_evaluation` purchase type, fixed at **19900 USD cents**, distinct from product catalog orders. Never trust a client-submitted price.
2. Create an authenticated, access-controlled evaluation record tied to the patient and chosen program. Persist only minimum necessary PHI in a HIPAA-appropriate system with verified vendor agreements, audit logging, and retention rules; never put PHI in Stripe metadata or public GitHub.
3. Present the approved evaluation consent and refund acknowledgment in the secure intake system, with version, signer, and timestamp. Validate completed signatures on the server before creating checkout.
4. Create a Stripe **test-mode** checkout session for the dedicated evaluation, using server-held credentials. Attach only a non-PHI internal evaluation identifier.
5. Use a verified Stripe webhook and idempotent fulfillment processing. Do not issue lab orders or email sensitive information from the browser redirect/success page.
6. Following confirmed payment, notify authorized staff through an approved channel to arrange Quest lab orders within 24 hours, excluding weekends and holidays. Track lab-order issuance separately from payment.
7. Only after lab results and telehealth evaluation, allow clinical approval and separately enroll the patient in SimplePractice monthly autopay.
8. Test duplicate clicks, failed/abandoned payments, replayed webhooks, ineligible states, missing consent, refunds, and partial outages before deployment.
9. Have counsel review the nonrefundability wording and proposed membership term/cancellation policies for Florida and Nevada.

## Patient-facing flow
Membership selection → eligibility (FL/NV) → secure intake and e-signature → fixed $199 Stripe payment → confirmed payment → lab order by staff → Quest appointment and bloodwork → telehealth visit within 60 days → clinician decision → optional SimplePractice monthly membership.

**Do not activate payments until the existing backend, Stripe configuration, and secure intake deployment are verified.**
