# Wellness Med Club

Patient ordering and compliance platform for [wellnessmedclub.com](https://wellnessmedclub.com):
product catalog, cart and Stripe checkout, medical intake and consents, ID and lab uploads,
provider approvals, refills, messaging, appointments, and an admin panel.

> New owner? Start with **[HANDOVER.md](HANDOVER.md)**. It walks through setting up
> Supabase, Stripe, email, hosting and the domain from scratch.
> For what the platform does from the clinic's side, see [docs/business-overview.md](docs/business-overview.md).

## Tech stack

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Radix) |
| Framework | [TanStack Start](https://tanstack.com/start) (file-based routes, server functions, SSR) on Vite 7 |
| Server build | [Nitro](https://nitro.build): Node server by default, also Vercel / Netlify / Cloudflare |
| Database, auth, file storage | [Supabase](https://supabase.com) (Postgres with row-level security) |
| Payments | [Stripe](https://stripe.com) embedded Checkout plus webhooks |
| Email | [Resend](https://resend.com) with React Email templates |

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env    # then fill in your keys
npm run dev             # http://localhost:8080
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build into `.output/` |
| `npm start` | Run the production build (`node .output/server/index.mjs`, port 3000 or `$PORT`) |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |

## Project layout

```
src/
  routes/              Pages and API endpoints (file name = URL)
    admin.*.tsx        Admin panel (orders, approvals, products, coupons, customers, refills, availability)
    account_.*.tsx     Patient portal (orders, intake, consents, documents, approvals, refills, messages)
    api/public/payments/webhook.ts   Stripe webhook
    api/public/availability.ts       Public appointment availability feed
    api/auth/send-email-hook.ts      Supabase Auth "Send Email" hook → branded auth emails
  components/          UI components (site/, admin/, ui/ = shadcn)
  lib/                 Business logic. *.functions.ts = server functions called from the UI,
                       *.server.ts = server-only helpers (Stripe, email, Supabase admin)
  lib/email-templates/ React Email templates for auth emails
  integrations/supabase/  Supabase clients and generated DB types
supabase/migrations/   Full database schema, policies, functions and product seed data
docs/                  Business overview and open client questions
e2e/                   End-to-end checkout test (Python/Playwright)
```

## Environment variables

All variables are listed with explanations in [`.env.example`](.env.example).
Variables starting with `VITE_` are baked into the browser bundle at **build time**, so
rebuild after changing them. Everything else is read by the server at runtime.

## Database

The schema lives in `supabase/migrations/`. Apply it to a new Supabase project with the
[Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push
```

After a schema change, regenerate the TypeScript types:

```bash
npx supabase gen types typescript --project-id YOUR-PROJECT-REF > src/integrations/supabase/types.ts
```
