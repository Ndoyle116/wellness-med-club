import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import consultAsset from "@/assets/photos/np-consult-writing.jpg";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Wellness Med Club" },
      { name: "description", content: "Membership (coming soon) vs à la carte care, plus our compliant workflow: intake, consents, lab review, consultation, and scheduling." },
      { property: "og:title", content: "How It Works — Wellness Med Club" },
      { property: "og:description", content: "A streamlined, compliant, patient-centered workflow." },
    ],
  }),
  component: HowItWorksPage,
});

const steps = [
  {
    n: "01",
    title: "Online Product Selection & Checkout",
    body: "Browse vitamins, peptides, lab panels, and hormone or prescription therapies. Each product includes a clear description, intended use, and necessary precautions. Add items to your cart, complete intake forms and consents, then check out.",
  },
  {
    n: "02",
    title: "Required Intake & Eligibility Screening",
    body: "Every patient completes a medical intake before purchase. We confirm residency in FL or NV, screen for relevant conditions, current medications, allergies, pregnancy or breastfeeding status, and pertinent medical history. You attest that all information is accurate.",
  },
  {
    n: "03",
    title: "Product-Specific Consents & Acknowledgments",
    body: "Each category carries its own consent — a general medical disclaimer, a vitamin & supplement consent (lab work within the past year), and a peptide & injectable consent covering risks, benefits, side effects, and proper administration. All consents are e-signed before checkout completes.",
  },
  {
    n: "04",
    title: "Lab Panel Ordering & Processing",
    body: "Lab panels — including our 7-panel option — can be purchased directly. You acknowledge clinical correlation requirements and processing times. Orders are processed within 24 business hours. Friday orders may be processed Monday. Weekends and holidays are excluded.",
  },
  {
    n: "05",
    title: "Lab Requirements for Hormone & Controlled Therapies",
    body: "For TRT, HRT, and related therapies, you must have completed relevant lab work within the last 6 months. If labs aren't available, you'll purchase and complete the appropriate panel through our platform. No treatment begins without current labs.",
  },
  {
    n: "06",
    title: "Controlled Substances & Required Consultation",
    body: "Controlled or prescription-based therapies require a 15-minute consultation, included in your total. You'll be prompted to schedule it at checkout. Your order remains in pending status until labs are reviewed, the consultation is complete, and clinical appropriateness is confirmed.",
  },
  {
    n: "07",
    title: "Scheduling Your Visit",
    body: "When a visit is required or chosen, you'll pick an available time at checkout. Our care team confirms your appointment details and documents the visit in your record.",
  },
];

function HowItWorksPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="how it works"
        title="A compliant, patient-centered workflow."
        subtitle="From product selection to consultation, every step is designed for safety, transparency, and your peace of mind."
      />

      <div className="mx-auto max-w-5xl px-6 pt-4">
        <img src={consultAsset} alt="Nurse practitioner reviewing patient intake at Wellness Med Club" loading="lazy" className="w-full h-[440px] object-cover" />
      </div>

      <section className="mx-auto max-w-6xl px-6 pt-16">
        <div className="text-center mb-8">
          <div className="divider-script mb-2">two ways to receive care</div>
          <h2 className="font-serif text-2xl md:text-3xl">Membership vs. À La Carte</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-background border border-border p-8">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="eyebrow">membership</div>
              <span className="text-[10px] uppercase tracking-[0.22em] border border-accent text-accent px-2 py-1">
                Coming soon — not yet available
              </span>
            </div>
            <h3 className="font-serif text-2xl">$99 / month</h3>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              A planned monthly membership for patients who want ongoing access to their care team.
              Membership details, benefits, and enrollment will be announced when the program
              launches. Membership cannot be purchased at this time.
            </p>
          </div>
          <div className="bg-background border border-border p-8">
            <div className="eyebrow mb-2">à la carte</div>
            <h3 className="font-serif text-2xl">Pay per order</h3>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Available today. Purchase individual products, lab panels, and provider visits as you
              need them — no ongoing commitment. Each order follows the intake, consent, lab, and
              provider-review steps outlined below.
            </p>
            <Link
              to="/products"
              className="mt-5 inline-block text-xs uppercase tracking-[0.22em] border-b border-foreground pb-0.5 hover:text-accent hover:border-accent"
            >
              Browse products
            </Link>
          </div>
        </div>
        <div className="mt-6 border border-border bg-cream p-5 text-sm leading-relaxed text-foreground">
          <p className="text-xs uppercase tracking-[0.22em] font-semibold mb-3">
            Emergency Care Disclaimer
          </p>
          <p>
            Wellness Med does not provide emergency medical services through its membership or À
            La Carte programs.
          </p>
          <p className="mt-3">
            The member communication portal is monitored during regular business hours only and
            should not be used for emergencies or time-sensitive medical concerns.
          </p>
          <p className="mt-3">
            For life-threatening emergencies, call 911 or visit the nearest emergency department
            immediately.
          </p>
          <p className="mt-3">
            For urgent medical concerns outside regular business hours, seek care at an
            appropriate urgent care facility or emergency department.
          </p>
          <p className="mt-3">
            Wellness Med does not guarantee immediate provider availability through the
            communication portal.
          </p>
          <p className="mt-3 text-xs italic text-muted-foreground">
            Note: the member communication portal referenced above is part of the membership
            program, which is still coming soon and is not yet available.
          </p>
        </div>

      </section>

      <section className="mx-auto max-w-4xl px-6 py-20">

        <ol className="space-y-12">
          {steps.map((s, idx) => (
            <li key={s.n} className="grid grid-cols-[auto_1fr] gap-8 pb-12 border-b border-border last:border-b-0">
              <div className="font-serif text-6xl md:text-7xl text-accent leading-none">{s.n}</div>
              <div>
                <h2 className="font-serif text-2xl md:text-3xl">{s.title}</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">{s.body}</p>
                {idx === steps.length - 1 && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/products" className="inline-flex items-center bg-ink text-primary-foreground px-6 py-3 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors">
                      Browse Products
                    </Link>
                    <Link to="/contact" className="inline-flex items-center border border-ink px-6 py-3 text-xs uppercase tracking-[0.22em] hover:bg-ink hover:text-primary-foreground transition-colors">
                      Book Consultation
                    </Link>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <div className="divider-script mb-3">our promise</div>
          <h2 className="text-3xl md:text-4xl font-serif">Care that's safe, transparent, and personal.</h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Every order, every consent, every lab — reviewed by a licensed
            clinician before treatment begins. That's the standard at Wellness Med Club.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
