import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/memberships")({
  head: () => ({ meta: [{ title: "Memberships — Wellness Med Club" }, { name: "description", content: "Explore Wellness Med Club's TRT, HRT, weight management, and Essential Wellness memberships for Florida and Nevada residents." }] }),
  component: MembershipsPage,
});

const plans = [
  { name: "Men's TRT", price: "$125", benefits: ["Injectable testosterone when clinically appropriate", "Included routine monitoring bloodwork", "Ongoing clinician-guided follow-up"] },
  { name: "Women's HRT", price: "$179", benefits: ["Eligible prescribed hormone medications", "Included routine monitoring bloodwork", "Individualized hormone care and follow-up"] },
  { name: "Phentermine Weight Loss", price: "$119", benefits: ["Phentermine medication when medically appropriate", "Included routine monitoring bloodwork", "Optional topiramate add-on: +$30/month ($149 total)"] },
  { name: "Essential Wellness", price: "$89", benefits: ["Medication management for GLP-1 therapy, blood pressure, thyroid, cholesterol and other chronic conditions", "GLP-1 medications are not included in the membership price", "Sick visits and up to two telehealth visits per month", "Six-month follow-up lab panel and annual comprehensive lab panel", "Prescriptions may be sent to a local pharmacy when clinically appropriate, allowing patients to use insurance subject to coverage"] },
];

function MembershipsPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="personalized care" title="Wellness Memberships" subtitle="Flexible, clinician-guided care for eligible residents of Florida and Nevada. Each membership begins with a one-time $199 evaluation, comprehensive baseline blood panel, and telehealth consultation." />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <article key={plan.name} className="border border-border bg-background p-8 md:p-10">
              <div className="eyebrow mb-3">Wellness Med Club</div>
              <h2 className="font-serif text-3xl">{plan.name}</h2>
              <p className="mt-4"><span className="font-serif text-4xl">{plan.price}</span><span className="text-muted-foreground"> / month</span></p>
              <ul className="mt-7 space-y-4">
                {plan.benefits.map((benefit) => <li key={benefit} className="flex items-start gap-3 text-sm leading-relaxed"><CheckCircle2 className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" /><span>{benefit}</span></li>)}
              </ul>
              <Link to="/membership-evaluation" className="mt-8 inline-flex items-center gap-2 border-b border-foreground pb-1 text-xs uppercase tracking-[0.18em] hover:text-accent hover:border-accent">Review the $199 evaluation <ArrowRight className="h-4 w-4" /></Link>
            </article>
          ))}
        </div>
        <div className="mt-12 bg-secondary p-8 md:p-12">
          <h2 className="font-serif text-3xl">Included with every membership</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">Your secure patient portal lets you communicate with staff, request appointments, and request prescription refills. All memberships include 15% off eligible website products and supplements, plus 15% off eligible self-pay lab work purchased through the website. When clinically warranted, bloodwork may be ordered through Quest Diagnostics and billed to insurance, subject to coverage. Patients are responsible for any charges not covered by insurance.</p>
          <h3 className="mt-8 font-serif text-2xl">Add Essential Wellness · +$50/month</h3>
          <p className="mt-3 text-muted-foreground leading-relaxed">Already enrolled in Men's TRT, Women's HRT, or Phentermine Weight Loss? Add Essential Wellness services to your existing membership for an additional $50 per month. This includes eligible chronic medication management, sick visits, up to two telehealth visits per month, and the Essential Wellness follow-up lab schedule. Medications, including GLP-1 medications, are not included in the add-on price unless otherwise specified.</p>
          <p className="mt-5 text-sm text-muted-foreground">Additional or requested bloodwork may have an extra charge. Insurance may be used for eligible labs and prescriptions sent to local pharmacies, subject to your plan. Wellness Med Club does not submit insurance prior authorizations.</p>
        </div>
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="font-serif text-3xl">How to get started</h2>
          <ol className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
            <li><strong className="text-foreground">1. Initial evaluation — $199.</strong> Includes baseline comprehensive bloodwork and a telehealth consultation. This is separate from the monthly membership fee.</li>
            <li><strong className="text-foreground">2. Complete your labs.</strong> Following successful payment, the lab order will be emailed within 24 hours, excluding weekends and holidays. You schedule your own Quest Diagnostics appointment. Additional tests may be required at extra cost.</li>
            <li><strong className="text-foreground">3. Meet with your clinician.</strong> Complete the required bloodwork before your telehealth visit, to be scheduled within 60 days of purchase. Membership and prescriptions are subject to medical approval.</li>
          </ol>
          <p className="mt-6 text-sm text-muted-foreground">After payment is processed and a lab order has been issued, the evaluation fee is nonrefundable except where required by law. A secure intake, consent, and payment workflow must be completed before online evaluation purchases are enabled.</p>
          <Link to="/membership-evaluation" className="mt-8 inline-flex items-center gap-2 bg-ink px-7 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:bg-accent">Review My $199 Evaluation <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </SiteLayout>
  );
}
