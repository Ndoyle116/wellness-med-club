import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Wellness Med Club" },
      { name: "description", content: "Medical weight loss subscriptions, peptide therapy, hormone optimization, and telehealth visits at Wellness Med Club." },
      { property: "og:title", content: "Services — Wellness Med Club" },
      { property: "og:description", content: "Medical weight loss, peptide therapy, hormones, and telehealth." },
    ],
  }),
  component: ServicesPage,
});

const services = [
  {
    n: "01",
    title: "Medical Weight Loss Subscriptions",
    desc: "Evidence-based weight loss programs combining prescription therapies, ongoing clinical guidance, and lifestyle support — designed around your goals.",
    bullets: ["Initial intake & lab review", "Monthly clinician check-ins", "Prescription therapies as appropriate"],
    to: "/medical-weight-loss" as const,
  },
  {
    n: "02",
    title: "Peptide Therapy Subscriptions",
    desc: "Targeted peptides to support healing, recovery, metabolism, performance, and longevity — paired with proper education and consents.",
    bullets: ["Personalized peptide selection", "Injection education & support", "Ongoing protocol adjustment"],
    to: "/products" as const,
  },
  {
    n: "03",
    title: "Vitamin Therapies & Hormone Optimization",
    desc: "Injectable vitamins, NAD+, glutathione, and bio-identical hormone therapy — TRT, HRT, progesterone, and estrogen — dosed to your labs.",
    bullets: ["B12, B-complex, D3, NAD+, glutathione", "Testosterone, progesterone, estrogen, DHEA", "Labs & telehealth where required"],
    to: "/vitamin-hormone-therapy" as const,
  },
  {
    n: "04",
    title: "Hair, Skin & Intimate Wellness",
    desc: "Hair restoration, medical-grade skin peptides, supportive prescriptions, and intimacy therapies — reviewed by a licensed provider.",
    bullets: ["Finasteride, minoxidil, GHK-Cu peptides", "Climax, Scream, Euphoria & PDE-5 support", "Ondansetron and adjunct medications"],
    to: "/hair-skin-intimate-wellness" as const,
  },
  {
    n: "05",
    title: "One-Time Telehealth Visits",
    desc: "Quick, professional virtual consultations for residents of Florida and Nevada when you need clinical input on demand.",
    bullets: ["15-minute focused visit", "Documented in your chart", "Booked via integrated scheduling"],
    to: "/telehealth" as const,
  },
];

function ServicesPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="our services" title="Modern, patient-centered wellness." subtitle="Choose the program that fits where you are — every offering includes the clinical oversight and consent your care deserves." />

      <section className="mx-auto max-w-7xl px-6 py-24 grid md:grid-cols-2 gap-6">
        {services.map((s) => (
          <article key={s.n} className="bg-secondary p-10 hover:bg-cream transition-colors">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-serif text-2xl md:text-3xl">{s.title}</h2>
              <span className="font-serif text-5xl text-accent">{s.n}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            <ul className="mt-6 space-y-2 text-sm text-foreground/80">
              {s.bullets.map((b) => (
                <li key={b} className="flex gap-2"><span className="text-accent">—</span> {b}</li>
              ))}
            </ul>
            <Link to={s.to} className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </section>


      <section className="bg-ink text-primary-foreground">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-serif">Not sure which service is right for you?</h2>
          <p className="mt-4 text-primary-foreground/75">Book a 15-minute consultation and Nicole will help guide you.</p>
          <Link to="/contact" className="mt-8 inline-flex items-center bg-accent text-accent-foreground px-7 py-4 text-xs uppercase tracking-[0.22em] hover:opacity-90 transition-opacity">
            Book Consultation
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
