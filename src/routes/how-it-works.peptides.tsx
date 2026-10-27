import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { FlowSteps, AcknowledgmentBox, type FlowStep } from "@/components/site/FlowSteps";
import vialsAsset from "@/assets/photos/peptide-vials-box.jpg";

export const Route = createFileRoute("/how-it-works/peptides")({
  head: () => ({
    meta: [
      { title: "Copper Peptide Ordering Process — Wellness Med Club" },
      {
        name: "description",
        content:
          "Non-FDA-approved copper peptide ordering: product selection, acknowledgments, disclosures, checkout, processing, and shipping.",
      },
      { property: "og:title", content: "Copper Peptide Ordering Process" },
    ],
  }),
  component: PeptidesFlow,
});

const STEPS: FlowStep[] = [
  {
    n: "01",
    title: "Select Copper Peptide",
    body: (
      <>
        Choose Copper Peptide from the online store. Review product information, ingredients,
        directions, and storage requirements prior to purchase.
      </>
    ),
  },
  {
    n: "02",
    title: "Sign required acknowledgments",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Wellness Med Club Business Consent</li>
        <li>Product Disclosure & Acknowledgment</li>
        <li>Liability Waiver</li>
        <li>Privacy & Communication Consent</li>
      </ul>
    ),
  },
  {
    n: "03",
    title: "Product disclosure acknowledgment",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Not dispensed through a licensed 503A or 503B compounding pharmacy.</li>
        <li>Not evaluated or approved by the FDA.</li>
        <li>No guarantees regarding outcomes, effectiveness, or results.</li>
        <li>No product warranties provided.</li>
        <li>You assume responsibility for your decision to purchase and use the product.</li>
      </ul>
    ),
  },
  {
    n: "04",
    title: "Secure checkout",
    body: (
      <>
        All sales are final and no refunds are issued once payment has been processed. Product
        availability may vary; orders may require verification before shipment.
      </>
    ),
  },
  {
    n: "05",
    title: "Order processing",
    body: (
      <>
        Most orders are processed within 24 business hours. Excludes weekends, holidays, inventory
        delays, and periods of high order volume.
      </>
    ),
  },
  {
    n: "06",
    title: "Shipping & delivery",
    body: (
      <>
        Shipping timelines are estimates only. Wellness Med Club does not control carrier
        schedules; delays may occur due to weather, holidays, or carrier issues.
      </>
    ),
  },
  {
    n: "07",
    title: "Product delivered",
    body: <>Carefully review all directions, storage requirements, and product information before use.</>,
  },
];

function PeptidesFlow() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="non-FDA-approved product"
        title="Copper peptide ordering process"
        subtitle="Most orders processed within 24 business hours. Excludes weekends, holidays, and periods of high order volume."
      />
      <div className="mx-auto max-w-5xl px-6 -mt-4">
        <img src={vialsAsset} alt="Wellness Med Club peptide vials" loading="lazy" className="w-full h-[420px] object-cover" />
      </div>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-24">
        <FlowSteps steps={STEPS} />
        <AcknowledgmentBox>
          <ul className="list-disc pl-5 space-y-1">
            <li>Copper Peptide is not FDA-approved.</li>
            <li>Not dispensed through a licensed 503A or 503B compounding pharmacy.</li>
            <li>No guarantees regarding safety, effectiveness, outcomes, or results.</li>
            <li>You assume responsibility for your decision to purchase and use the product.</li>
            <li>All sales are final and non-refundable once payment has been processed.</li>
          </ul>
        </AcknowledgmentBox>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/products"
            className="bg-ink text-primary-foreground px-5 py-3 text-xs uppercase tracking-[0.22em] hover:bg-accent"
          >
            Browse peptides
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
