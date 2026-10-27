import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/membership-evaluation")({
  head: () => ({ meta: [{ title: "Membership Evaluation — Wellness Med Club" }] }),
  component: EvaluationPage,
});

const programs = ["Men's TRT", "Women's HRT", "Phentermine Weight Loss", "Essential Wellness"];

function EvaluationPage() {
  const [program, setProgram] = useState("");
  const [residency, setResidency] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <SiteLayout>
      <PageHero eyebrow="begin your care" title="$199 Membership Evaluation" subtitle="Review the evaluation process and requirements before beginning your secure medical intake." />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="bg-secondary p-7 md:p-10">
          <h2 className="font-serif text-3xl">Evaluation overview</h2>
          <p className="mt-4 text-muted-foreground">The one-time $199 evaluation includes comprehensive baseline bloodwork and a telehealth consultation. It does not guarantee acceptance into a membership or a prescription.</p>
          <label htmlFor="program" className="mt-8 block text-sm font-medium">Membership you're interested in</label>
          <select id="program" value={program} onChange={(event) => setProgram(event.target.value)} className="mt-2 w-full border border-border bg-background p-3">
            <option value="">Select a membership</option>
            {programs.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <label htmlFor="residency" className="mt-6 block text-sm font-medium">State of residence</label>
          <select id="residency" value={residency} onChange={(event) => setResidency(event.target.value)} className="mt-2 w-full border border-border bg-background p-3">
            <option value="">Select your state</option>
            <option value="FL">Florida</option>
            <option value="NV">Nevada</option>
            <option value="other">Other</option>
          </select>
          {residency === "other" && <p role="status" className="mt-3 text-sm">Membership evaluations are currently available only to Florida and Nevada residents.</p>}
          <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p><strong className="text-foreground">Lab order:</strong> Emailed within 24 hours of successful payment, excluding weekends and holidays. You must schedule your own Quest Diagnostics appointment.</p>
            <p><strong className="text-foreground">Telehealth:</strong> Complete your required bloodwork before the telehealth appointment, which must be scheduled within 60 days of purchase.</p>
            <p><strong className="text-foreground">Additional testing:</strong> Your clinician may require additional bloodwork at an additional cost.</p>
            <p><strong className="text-foreground">Refund policy:</strong> Once payment is processed and the lab order is issued, the evaluation is nonrefundable except where required by law.</p>
          </div>
          <label className="mt-7 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1" />
            <span>I understand the evaluation, lab scheduling, eligibility, and refund information above.</span>
          </label>
          <div className="mt-8 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">Online medical intake, electronic signature, and payment are being securely configured. This preview does not collect or save medical information and cannot accept payment.</p>
            <Link to="/contact" className={`mt-5 inline-flex bg-ink px-6 py-4 text-xs uppercase tracking-[0.16em] text-primary-foreground hover:bg-accent ${!program || !["FL", "NV"].includes(residency) || !acknowledged ? "pointer-events-none opacity-40" : ""}`} aria-disabled={!program || !["FL", "NV"].includes(residency) || !acknowledged}>Contact us about my evaluation</Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
