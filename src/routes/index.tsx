import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArrowRight, Leaf, Syringe, FlaskConical, Pill, ShieldCheck, ClipboardCheck } from "lucide-react";
import heroAsset from "@/assets/photos/np-your-goals.png";
import productsAsset from "@/assets/home-shop-vials.png";
import botanicalAsset from "@/assets/home-compliance-vials.png";
const hero = heroAsset;
const products = productsAsset;
const botanical = botanicalAsset;

export const Route = createFileRoute("/")({
  component: HomePage,
});

const services = [
  { n: "01", title: "Medical Weight Loss", desc: "Evidence-based programs combining clinical guidance and prescription therapies.", to: "/medical-weight-loss" as const },
  { n: "02", title: "Peptide Therapy", desc: "Support healing, performance, metabolism, and longevity with targeted peptides.", to: "/products" as const },
  { n: "03", title: "Hormone Optimization", desc: "Personalized HRT and TRT protocols guided by current labs and clinical review.", to: "/vitamin-hormone-therapy" as const },
  { n: "04", title: "Zoom Call w/ Provider", desc: "Convenient one-time virtual consultations for FL and NV residents.", to: "/telehealth" as const },
];

const categories = [
  { icon: Pill, title: "Vitamins & Supplements", to: "/products" },
  { icon: Syringe, title: "Peptides & Injectables", to: "/products" },
  { icon: FlaskConical, title: "Lab Panels", to: "/products" },
  { icon: Leaf, title: "Hormone Therapies", to: "/products" },
];

function HomePage() {
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="divider-script mb-5">welcome to</div>
            <h1 className="text-5xl md:text-7xl font-serif leading-[1.05] text-foreground">
              Wellness <br />
              <span className="italic">Med Club</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
              A nurse practitioner–led concierge practice for medical weight loss,
              peptide therapy, and personalized wellness — built around you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-ink text-primary-foreground px-7 py-4 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors"
              >
                Shop & Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 border border-ink text-ink px-7 py-4 text-xs uppercase tracking-[0.22em] hover:bg-ink hover:text-primary-foreground transition-colors"
              >
                How It Works
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Licensed APRN</span>
              <span>FL & NV</span>
            </div>
          </div>
          <div className="relative">
            <img
              src={hero}
              alt="Nicole Doyle, APRN — founder of Wellness Med Club"
              width={1600}
              height={1200}
              className="w-full h-[520px] object-cover"
            />
            <div className="absolute bottom-6 left-6 bg-background px-5 py-3 shadow-sm">
              <div className="font-serif text-lg">Nicole Doyle, APRN</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Founder & Clinician</div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT STRIP */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <div className="eyebrow mb-3">About</div>
        <h2 className="text-4xl md:text-5xl font-serif">Modern medicine, made personal.</h2>
        <p className="mt-6 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Welcome to Wellness Med Club — a nurse practitioner–led practice
          specializing in medical weight loss and peptide therapy. With years of
          experience as both a Registered Nurse and Nurse Practitioner, we bring
          strong clinical expertise and compassionate, patient-focused care to
          every visit.
        </p>
        <Link
          to="/about"
          className="mt-8 inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-foreground border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors"
        >
          Learn more <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* SERVICES */}
      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center mb-16">
            <div className="eyebrow mb-3">Services</div>
            <h2 className="text-4xl md:text-5xl font-serif">Our Offerings</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Patient-centered wellness designed to help you feel your best.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => (
              <Link
                key={s.n}
                to={s.to}
                className="bg-background p-8 group hover:shadow-md transition-shadow block"
              >
                <div className="font-serif text-5xl text-accent mb-4">{s.n}</div>
                <h3 className="font-serif text-xl mb-3 group-hover:text-accent transition-colors">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-foreground/70 group-hover:text-accent transition-colors">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
        <img src={products} alt="Semaglutide, tirzepatide and peptide vials with a syringe on marble" width={1536} height={1024} loading="lazy" className="w-full h-[480px] object-cover" />
        <div>
          <div className="eyebrow mb-3">Shop</div>
          <h2 className="text-4xl md:text-5xl font-serif">Curated for your protocol.</h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Browse vitamins, peptides, lab panels, and prescription therapies —
            each paired with the right intake forms and consents to keep your
            care safe and compliant.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {categories.map((c) => (
              <Link
                key={c.title}
                to={c.to}
                className="flex items-center gap-3 border border-border px-4 py-4 hover:border-accent hover:text-accent transition-colors"
              >
                <c.icon className="h-5 w-5" />
                <span className="text-sm">{c.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* COMPLIANCE */}
      <section className="bg-ink text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <img src={botanical} alt="Wellness Med Club sterile vials arranged on a marble tray" width={1536} height={1024} loading="lazy" className="w-full h-[420px] object-cover order-last lg:order-first" />
          <div>
            <div className="eyebrow mb-3 !text-primary-foreground/60">Compliance & Care</div>
            <h2 className="text-4xl md:text-5xl font-serif">Safety, built into every step.</h2>
            <p className="mt-5 text-primary-foreground/75 leading-relaxed">
              Every order is reviewed against your intake, current labs, and
              clinical history. Controlled therapies always include a 15-minute
              consultation before anything is dispensed.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Medical intake & eligibility screening",
                "Product-specific consents & acknowledgments",
                "Lab review for hormone & controlled therapies",
                "Required clinician consultation for controlled meds",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-primary-foreground/85">
                  <ClipboardCheck className="h-5 w-5 text-accent shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
            <Link
              to="/how-it-works"
              className="mt-8 inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-accent border-b border-accent pb-1"
            >
              Read the full workflow <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="divider-script mb-4">begin</div>
          <h2 className="text-4xl md:text-5xl font-serif">Ready to feel your best?</h2>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
            Start by browsing our offerings or booking a consultation with Nicole.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/products" className="inline-flex items-center bg-ink text-primary-foreground px-7 py-4 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors">
              Browse Products
            </Link>
            <Link to="/contact" className="inline-flex items-center border border-ink px-7 py-4 text-xs uppercase tracking-[0.22em] hover:bg-ink hover:text-primary-foreground transition-colors">
              Book Consultation
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
