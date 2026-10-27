import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { FlowSteps, AcknowledgmentBox, type FlowStep } from "@/components/site/FlowSteps";
import photoAsset from "@/assets/photos/education-telehealth.jpg";

export const Route = createFileRoute("/how-it-works/labs")({
  head: () => ({
    meta: [
      { title: "Laboratory Order & Review Process — Wellness Med Club" },
      {
        name: "description",
        content:
          "Lab panel ordering: select panel, choose review option, sign consents, secure checkout, processing, testing, and results.",
      },
      { property: "og:title", content: "Laboratory Order & Review Process" },
    ],
  }),
  component: LabsFlow,
});

const STEPS: FlowStep[] = [
  {
    n: "01",
    title: "Select your laboratory panel",
    body: <>Choose the laboratory panel that best fits your needs.</>,
  },
  {
    n: "02",
    title: "Choose your review option",
    body: (
      <div className="space-y-5">
        <div>
          <div className="eyebrow mb-1">Option A — Laboratory order only</div>
          <p className="text-sm">
            Purchase laboratory testing only, without scheduling a provider review through
            Wellness Med Club. By selecting this option, you acknowledge:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
            <li>Testing is being ordered at your request.</li>
            <li>You may review results with your primary care provider, specialist, or another provider of your choosing.</li>
            <li>Wellness Med Club is not responsible for interpreting results when a review appointment is not selected.</li>
            <li>No provider consultation is included.</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Some lab results may take up to 7 business days to be finalized. Plan accordingly when
            coordinating follow-up care.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-1">Option B — Laboratory order + provider review ($50)</div>
          <p className="text-sm">
            Add a 15-minute provider review appointment scheduled through the Wellness Med Club
            online calendar. The provider will review results, abnormal findings, potential
            recommendations, and questions regarding the ordered panel.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
            <li>Schedule far enough out to ensure results are available — some take up to 7 business days.</li>
            <li>If results aren't available at the scheduled time, a new appointment may be required.</li>
            <li>Reschedule with at least 24 hours' notice.</li>
            <li>Appointment fees are non-refundable once booked. Missed appointments and no-shows are not refunded.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    n: "03",
    title: "Review and sign required consents",
    body: (
      <>
        <ul className="list-disc pl-5 space-y-1">
          <li>Wellness Med Club Business Consent</li>
          <li>Laboratory Testing Consent</li>
          <li>Telehealth Consent (if selecting provider review)</li>
          <li>Privacy & Communication Consent</li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          By signing, you acknowledge that lab testing does not establish a provider-patient
          relationship unless a consultation is completed, does not constitute medical treatment
          on its own, may require additional evaluation, and that specific findings or outcomes
          cannot be guaranteed.
        </p>
      </>
    ),
  },
  {
    n: "04",
    title: "Secure checkout",
    body: (
      <>
        Complete payment through the secure online checkout portal. By submitting payment, you
        acknowledge up to 24 business hours of processing time (excluding weekends and holidays),
        that additional information may be requested, and that all sales are final once orders
        have been submitted. Provider review appointments are non-refundable once booked.
      </>
    ),
  },
  {
    n: "05",
    title: "Order processing",
    body: (
      <>
        Once reviewed and processed, you'll receive your laboratory requisition/order form by
        email, instructions for scheduling testing, and additional information regarding next
        steps. Most orders are processed within 24 business hours (excluding weekends and holidays).
      </>
    ),
  },
  {
    n: "06",
    title: "Complete laboratory testing",
    body: (
      <>
        Complete testing at the designated laboratory facility. Some tests may take up to 7
        business days for final results; timing varies by laboratory and tests ordered.
      </>
    ),
  },
  {
    n: "07",
    title: "Receive results",
    body: (
      <div className="space-y-3">
        <div>
          <div className="eyebrow mb-1">If laboratory order only was selected</div>
          <p className="text-sm">
            Review results with your chosen healthcare provider. You assume responsibility for
            obtaining interpretation and follow-up care.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-1">If laboratory order + provider review was selected</div>
          <p className="text-sm">
            Results are reviewed during your scheduled 15-minute provider appointment, covering
            findings, abnormal results, recommendations, and appropriate follow-up options.
          </p>
        </div>
      </div>
    ),
  },
];

function LabsFlow() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="laboratory panels"
        title="Laboratory order & review process"
        subtitle="Most orders processed within 24 business hours. Excludes weekends, holidays, incomplete orders, and situations requiring additional information."
      />
      <div className="mx-auto max-w-5xl px-6">
        <img src={photoAsset} alt="Peptide therapy education guide and provider telehealth visit" loading="lazy" className="w-full h-[420px] object-cover" />
      </div>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <FlowSteps steps={STEPS} />
        <AcknowledgmentBox>
          <ul className="list-disc pl-5 space-y-1">
            <li>Wellness Med Club has up to 24 business hours to process laboratory orders.</li>
            <li>Weekends and holidays are excluded from processing times.</li>
            <li>Some laboratory tests may require up to 7 business days for final results.</li>
            <li>Laboratory testing does not guarantee diagnosis or treatment.</li>
            <li>Patients who decline the provider review are responsible for obtaining interpretation from their chosen healthcare provider.</li>
            <li>The optional provider review appointment is an additional $50 fee.</li>
            <li>Appointments may be rescheduled with at least 24 hours' notice.</li>
            <li>Provider review appointment fees are non-refundable once booked. Missed appointments and no-shows are not refunded.</li>
            <li>All sales are final once laboratory orders have been submitted and processed.</li>
          </ul>
        </AcknowledgmentBox>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/products"
            className="bg-ink text-primary-foreground px-5 py-3 text-xs uppercase tracking-[0.22em] hover:bg-accent"
          >
            Browse lab panels
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
