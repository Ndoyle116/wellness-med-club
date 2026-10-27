import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { FlowSteps, AcknowledgmentBox, type FlowStep } from "@/components/site/FlowSteps";

export const Route = createFileRoute("/how-it-works/trt")({
  head: () => ({
    meta: [
      { title: "Testosterone Replacement Therapy Process — Wellness Med Club" },
      {
        name: "description",
        content:
          "TRT ordering: medical intake, recent labs (≤6 months), consents, government ID upload, required provider consultation, secure checkout, provider review, pharmacy fulfillment.",
      },
      { property: "og:title", content: "TRT Online Ordering Process" },
    ],
  }),
  component: TrtFlow,
});

const STEPS: FlowStep[] = [
  {
    n: "01",
    title: "Select Testosterone therapy",
    body: (
      <>
        Testosterone is a <strong>controlled substance</strong> and requires additional
        documentation, laboratory review, identity verification, and a provider consultation prior
        to approval.
      </>
    ),
  },
  {
    n: "02",
    title: "Complete medical intake",
    body: (
      <>
        FL/NV residency, medical history, current medications, allergies, height/weight, symptoms,
        previous testosterone use, existing conditions, and safety screening.
      </>
    ),
  },
  {
    n: "03",
    title: "Upload recent laboratory results (within 6 months)",
    body: (
      <>
        <ul className="list-disc pl-5 space-y-1">
          <li>Total Testosterone</li>
          <li>Free Testosterone</li>
          <li>CBC, CMP</li>
          <li>Estradiol</li>
          <li>PSA (if applicable)</li>
        </ul>
        <p className="mt-2">
          Lab testing cannot be purchased during the TRT ordering process — results must be
          uploaded before provider review.
        </p>
      </>
    ),
  },
  {
    n: "04",
    title: "Review and sign required consents",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Wellness Med Club Business Consent</li>
        <li>Telehealth Consent</li>
        <li>Testosterone Therapy Consent</li>
        <li>Controlled Substance Consent</li>
        <li>Privacy & Communication Consent</li>
      </ul>
    ),
  },
  {
    n: "05",
    title: "Upload government-issued photo ID",
    body: (
      <>
        Driver's license, state ID, or passport. Name on ID must match patient information
        submitted during registration.
      </>
    ),
  },
  {
    n: "06",
    title: "Schedule required provider consultation",
    body: (
      <>
        A 15-minute telehealth appointment is required for all TRT patients. There is no option to
        bypass this consultation.
      </>
    ),
  },
  {
    n: "07",
    title: "Secure checkout",
    body: (
      <>
        Payment does not guarantee approval. Orders remain pending until all required
        documentation, labs, ID verification, and consultation have been completed.
      </>
    ),
  },
  {
    n: "08",
    title: "Provider review & medical determination",
    body: (
      <>
        The provider may approve treatment, recommend modifications, request additional testing,
        or deny treatment if medically inappropriate.
      </>
    ),
  },
  {
    n: "09",
    title: "Prescription processing",
    body: (
      <>
        If approved, the prescription is transmitted to a licensed pharmacy. An adult age 18 or
        older must be available to sign for delivery of a controlled substance.
      </>
    ),
  },
  {
    n: "10",
    title: "Pharmacy fulfillment & shipping",
    body: (
      <>
        Wellness Med Club does not control pharmacy processing or carrier delivery schedules.
        Delays may occur due to pharmacy volume, weather, holidays, inventory, or carrier issues.
      </>
    ),
  },
  {
    n: "11",
    title: "Medication delivered",
    body: (
      <>
        Follow all provider and pharmacy instructions. Routine laboratory monitoring and follow-up
        appointments are required throughout treatment.
      </>
    ),
  },
];

function TrtFlow() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="testosterone replacement therapy"
        title="TRT online ordering process"
        subtitle="Most orders reviewed within 24 business hours after all required information has been received. Excludes weekends, holidays, incomplete applications, missing lab results, and situations requiring additional provider review."
      />
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <FlowSteps steps={STEPS} />
        <AcknowledgmentBox>
          <ul className="list-disc pl-5 space-y-1">
            <li>Testosterone is a controlled substance.</li>
            <li>Treatment approval is not guaranteed.</li>
            <li>Lab testing completed within the last 6 months is required.</li>
            <li>A valid government-issued photo ID is required.</li>
            <li>A provider consultation is required.</li>
            <li>
              Wellness Med Club is not responsible for pharmacy processing or shipping delays.
            </li>
            <li>All sales are final once services or medications have been rendered.</li>
          </ul>
        </AcknowledgmentBox>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/products"
            className="bg-ink text-primary-foreground px-5 py-3 text-xs uppercase tracking-[0.22em] hover:bg-accent"
          >
            Browse TRT options
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
