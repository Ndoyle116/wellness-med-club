import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { FlowSteps, AcknowledgmentBox, type FlowStep } from "@/components/site/FlowSteps";
import photoAsset from "@/assets/photos/injection-tracker.jpg";

export const Route = createFileRoute("/how-it-works/glp-1")({
  head: () => ({
    meta: [
      { title: "GLP-1 Online Ordering Process — Wellness Med Club" },
      {
        name: "description",
        content:
          "Step-by-step GLP-1 ordering: medication selection, medical intake, consents, optional labs and consultation, secure checkout, provider review, pharmacy fulfillment, and home delivery.",
      },
      { property: "og:title", content: "GLP-1 Online Ordering Process" },
      {
        property: "og:description",
        content:
          "Most orders reviewed within 24 business hours. Excludes weekends, holidays, and pharmacy processing times.",
      },
    ],
  }),
  component: GlpFlow,
});

const STEPS: FlowStep[] = [
  {
    n: "01",
    title: "Choose your GLP-1 medication",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Semaglutide</li>
        <li>Tirzepatide</li>
        <li>Other provider-approved GLP-1 medications</li>
      </ul>
    ),
  },
  {
    n: "02",
    title: "Complete medical intake",
    body: (
      <>
        Secure online questionnaire including Florida or Nevada residency verification, medical
        history, current medications, allergies, height and weight, pregnancy status, previous
        GLP-1 use, existing medical conditions, and safety screening.
      </>
    ),
  },
  {
    n: "03",
    title: "Sign required consents",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Wellness Med Club Business Consent</li>
        <li>Telehealth Consent</li>
        <li>GLP-1 Medication Consent</li>
        <li>Privacy & Communication Consent</li>
      </ul>
    ),
  },
  {
    n: "04",
    title: "Upload recent lab work (optional)",
    body: (
      <>
        Upload lab results from the last 12 months — CBC, CMP, A1C, lipid panel, thyroid studies.
        No labs? Purchase the <strong>Basic Lab Panel ($120)</strong> from our catalog, or continue
        without labs if permitted for your selected treatment.
      </>
    ),
  },
  {
    n: "05",
    title: "Optional provider consultation",
    body: (
      <>
        Schedule a 15-minute provider consultation, or proceed directly to provider review if
        eligible. Additional consultation may still be required at provider discretion.
      </>
    ),
  },
  {
    n: "06",
    title: "Secure checkout",
    body: (
      <>
        Complete payment through our secure portal. By submitting payment you acknowledge review
        may take up to 24 business hours, payment does not guarantee approval, all sales are
        final, and no refunds are available once payment has been processed.
      </>
    ),
  },
  {
    n: "07",
    title: "Provider review",
    body: (
      <>
        A licensed provider reviews your intake, consents, medical history, uploaded labs, and
        treatment eligibility. If approved, the prescription is transmitted to a licensed pharmacy.
      </>
    ),
  },
  {
    n: "08",
    title: "Pharmacy fulfillment",
    body: (
      <>
        Your prescription is sent to a licensed 503A or 503B compounding pharmacy. Wellness Med
        Club does not control pharmacy processing or inventory; fulfillment times vary.
      </>
    ),
  },
  {
    n: "09",
    title: "Shipping & delivery",
    body: (
      <>
        Medication is packaged and shipped directly to your home. Delivery estimates are not
        guaranteed and may be affected by weather, holidays, or carrier issues.
      </>
    ),
  },
  {
    n: "10",
    title: "Medication delivered to your door",
    body: <>Your treatment journey begins.</>,
  },
];

function GlpFlow() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="GLP-1 weight loss"
        title="GLP-1 online ordering process"
        subtitle="Most orders reviewed within 24 business hours. Excludes weekends, holidays, incomplete applications, pharmacy processing times, and situations requiring additional provider review."
      />
      <div className="mx-auto max-w-5xl px-6">
        <img src={photoAsset} alt="At-home GLP-1 injection and progress tracker" loading="lazy" className="w-full h-[420px] object-cover" />
      </div>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <FlowSteps steps={STEPS} />
        <AcknowledgmentBox>
          <ul className="list-disc pl-5 space-y-1">
            <li>Treatment approval is not guaranteed.</li>
            <li>
              Wellness Med Club reserves the right to approve, deny, or modify treatment
              recommendations based on medical necessity and patient safety.
            </li>
            <li>
              Most orders are reviewed within 24 business hours; weekends and holidays are
              excluded.
            </li>
            <li>
              Wellness Med Club is not responsible for pharmacy processing delays, inventory
              shortages, or shipping delays.
            </li>
            <li>All sales are final and non-refundable once payment has been processed.</li>
          </ul>
        </AcknowledgmentBox>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/products"
            className="bg-ink text-primary-foreground px-5 py-3 text-xs uppercase tracking-[0.22em] hover:bg-accent"
          >
            Browse GLP-1 products
          </Link>
          <Link
            to="/how-it-works"
            className="border border-border px-5 py-3 text-xs uppercase tracking-[0.22em] hover:border-accent hover:text-accent"
          >
            All workflows
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
