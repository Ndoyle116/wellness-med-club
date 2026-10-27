import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
const hero = "/photos/about-np-consult-new-smooth.png";
const secondSectionImage = "/photos/about-np-portrait-smooth.png";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Wellness Med Club" },
      { name: "description", content: "Meet Nicole Doyle, APRN — founder of Wellness Med Club, a nurse practitioner–led concierge wellness practice." },
      { property: "og:title", content: "About — Wellness Med Club" },
      { property: "og:description", content: "Meet Nicole Doyle, APRN — founder of Wellness Med Club." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="about us" title="A practice built on trust." subtitle="Concierge wellness, led by an experienced nurse practitioner." />

      <section className="mx-auto max-w-7xl px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
        <img src={hero} alt="Nicole Doyle, APRN, founder of Wellness Med Club" width={400} height={600} loading="lazy" className="w-full h-[600px] object-contain bg-paper" />
        <div>
          <div className="eyebrow mb-3">Founder</div>
          <h2 className="text-4xl md:text-5xl font-serif">Nicole Doyle, APRN</h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            With years of experience as both a Registered Nurse and Nurse
            Practitioner, Nicole founded Wellness Med Club to combine clinical
            rigor with the personalized, unhurried care patients deserve.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Every protocol is built around your goals, your labs, and your
            history — not a one-size-fits-all template.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6">
            <div>
              <div className="font-serif text-3xl">7+</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">Years Clinical</div>
            </div>
            <div>
              <div className="font-serif text-3xl">FL · NV</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">Licensed States</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="eyebrow mb-3">Philosophy</div>
          <h2 className="text-4xl md:text-5xl font-serif">Care that meets you where you are.</h2>
          <p className="mt-6 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We believe wellness should be evidence-based, accessible, and
            deeply personal. From your first intake to your ongoing protocol,
            every touchpoint is designed to keep you informed, safe, and
            in control of your care.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
        <div className="order-last lg:order-first">
          <div className="eyebrow mb-3">Approach</div>
          <h2 className="text-4xl md:text-5xl font-serif">Grounded in clinical evidence.</h2>
          <ul className="mt-8 space-y-5 text-muted-foreground">
            <li><span className="font-serif text-foreground text-lg block">Comprehensive intake.</span> Every patient completes a thorough medical screening before any therapy begins.</li>
            <li><span className="font-serif text-foreground text-lg block">Lab-informed decisions.</span> Hormone and controlled therapies require current labs, no exceptions.</li>
            <li><span className="font-serif text-foreground text-lg block">Ongoing partnership.</span> Treatment is a relationship — not a transaction.</li>
          </ul>
        </div>
        <img src={secondSectionImage} alt="Nicole Doyle, APRN, consulting with a patient" width={347} height={600} loading="lazy" className="w-full h-[500px] object-contain bg-paper" />
      </section>
    </SiteLayout>
  );
}
