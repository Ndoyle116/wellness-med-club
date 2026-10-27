# Wellness Med Club: Handover Guide

This guide covers everything needed to run wellnessmedclub.com on accounts you own:
your own Supabase, Stripe, Resend and hosting accounts.

Plan for about 1–2 hours for a first setup. Do the steps in order.

---

## What you need

| Account | Used for | Cost |
| --- | --- | --- |
| [GitHub](https://github.com) | Hosting the source code | Free |
| [Supabase](https://supabase.com) | Database, patient logins, document storage | Free tier to start; **Pro + HIPAA add-on required before real patient data** (see Compliance) |
| [Stripe](https://stripe.com) | Card payments | Per-transaction fees |
| [Resend](https://resend.com) | Sending emails (sign-up, password reset, order updates) | Free up to 3,000/month |
| Hosting, e.g. [Vercel](https://vercel.com), [Render](https://render.com) or [Netlify](https://netlify.com) | Running the website | Free or low cost to start |
| Domain registrar | Pointing wellnessmedclub.com at the host | You already own this |

---

## 1. Supabase (database and logins)

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard). Pick a US
   region and save the database password somewhere safe.
2. In **Project Settings → API**, copy:
   - Project URL → `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - `anon` public key → `SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**secret**, never share or put in browser code)
3. Create all tables, security rules, the product catalog and the `patient-documents` storage bucket:
   ```bash
   npm install
   npx supabase login
   npx supabase link --project-ref YOUR-PROJECT-REF
   npx supabase db push
   ```
4. **Authentication → URL Configuration**: set *Site URL* to `https://wellnessmedclub.com`
   and add `https://wellnessmedclub.com/**` (plus `http://localhost:8080/**` for local testing)
   to *Redirect URLs*.

## 2. Resend (email)

1. Sign up at [resend.com](https://resend.com) and add your domain under **Domains**.
   Add the DNS records it shows at your domain registrar and wait for "Verified".
2. Create an API key → `RESEND_API_KEY`.
3. Set `EMAIL_FROM`, e.g. `Wellness Med Club <noreply@wellnessmedclub.com>`.
4. Branded sign-up and password-reset emails: in Supabase go to
   **Authentication → Hooks → Send Email hook**, choose **HTTPS**, and set:
   - URL: `https://wellnessmedclub.com/api/auth/send-email-hook`
   - Click *Generate secret* and copy it → `SEND_EMAIL_HOOK_SECRET`

   Enable the hook **after** the site is deployed (step 4), otherwise sign-up emails will fail.

## 3. Stripe (payments)

1. In the [Stripe dashboard](https://dashboard.stripe.com) go to **Developers → API keys**:
   - Publishable key → `STRIPE_PUBLISHABLE_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
2. **Developers → Webhooks → Add endpoint**:
   - URL: `https://wellnessmedclub.com/api/public/payments/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.payment_failed`
   - Copy the *Signing secret* → `STRIPE_WEBHOOK_SECRET`
3. Start with **test-mode** keys (`pk_test_` / `sk_test_`). The site shows an orange
   "test mode" banner. Pay with card `4242 4242 4242 4242`, any future date and any CVC. When everything
   works, switch to live keys and create a live-mode webhook (it has its own signing secret).

Stripe products and prices don't need to be created by hand. Checkout creates them automatically
from the product catalog the first time each product is bought.

## 4. Hosting

Example with **Vercel** (Render and Netlify work similarly):

1. Push this repository to your GitHub account and import it in Vercel.
2. Framework preset: *Other*. Build command `npm run build`. Vercel is detected automatically.
3. Add **every** variable from `.env.example` under *Settings → Environment Variables*.
4. Deploy, then add `wellnessmedclub.com` under *Settings → Domains* and update DNS as shown.

On a plain Node server or VPS, run `npm run build`, then `npm start`
(listens on `$PORT`, default 3000).

> `VITE_*` variables are baked in at build time. After changing one, trigger a new deploy.

## 5. First admin user

1. Sign up on the live site with the clinician's email and confirm it.
2. In Supabase **SQL Editor**, run (replace the email):
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'clinician@example.com'
   on conflict do nothing;
   ```
3. Sign out and back in. The **Admin** panel is at `/admin`.

## 6. Final checks

- [ ] Sign up a test patient and receive the branded confirmation email
- [ ] Password reset email arrives and works
- [ ] Add a product to the cart, complete intake and consents, pay with the Stripe test card
- [ ] The order appears in `/admin/orders` and the patient gets an "order received" email
- [ ] Upload an ID document and a lab result, and view them from the admin panel
- [ ] Approve an order in admin; the patient gets the approval email
- [ ] Switch Stripe to live keys and the live webhook

---

## Existing data

This code **does not include the live data** stored in the current production database:
patient accounts, orders, intake answers, consents, uploaded IDs and lab files, messages,
coupons, appointment availability, and any product or price edits made in the admin panel.

If that data needs to move, it has to be exported from the current database and imported into your
Supabase project as a separate, planned step. Because it is protected health information,
do it over secure channels only, and decide with your compliance advisor whether to migrate it at all.

Patient passwords can't be copied. Migrated patients would need to use "Forgot password" once.

## Compliance

This platform handles protected health information (intake answers, ID documents, lab results).
Before taking real patients:

- Use a Supabase plan that offers a **HIPAA BAA**, sign it, and turn on the HIPAA project settings.
- Check that your hosting provider and email provider fit your compliance requirements, and keep
  medical details out of email bodies where possible.
- Keep the `service_role` key, Stripe secret key and hook secrets out of chat, email and code.

## Notes for developers

- Hosting target is chosen by Nitro (see `vite.config.ts`). Default is a Node server; Vercel,
  Netlify and Cloudflare are detected automatically.
- Auth emails (sign-up, password reset, magic link, email change) are sent by the Supabase
  Send Email hook at `/api/auth/send-email-hook` using the templates in `src/lib/email-templates`.
- Order and approval emails are sent from `src/lib/order-emails.server.ts` and
  `src/lib/notification-emails.server.ts`. Every attempt is recorded in `email_send_log`.
- The email queue tables (`email_send_state`, pgmq queues) created by the migrations are not
  used. Emails send immediately.
- The migration that seeds an admin role does nothing on a fresh database; use step 5 instead.
