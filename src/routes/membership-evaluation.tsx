import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { evaluationProgramLabels, evaluationSelectionSchema } from "@/lib/membership-evaluation";

export const Route = createFileRoute("/membership-evaluation")({
  head: () => ({ meta: [{ title: "Membership Evaluation — Wellness Med Club" }] }),
  component: EvaluationPage,
});

const programs = Object.entries(evaluationProgramLabels);
const STRIPE_EVALUATION_URL = "https://buy.stripe.com/28EdRbdvv6SdbQS2LE1ck00";

function EvaluationPage() {
  const [program, setProgram] = useState("");
  const [residency, setResidency] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const selectionValid = evaluationSelectionSchema.safeParse({
    program,
    residency,
    policyAcknowledged: acknowledged,
  }).success;

  const checkoutUrl = new URL(STRIPE_EVALUATION_URL);
  if (program && residency && residency !== "other") {
    // Non-medical reference only, so the selected program/state can be reconciled in Stripe.
    checkoutUrl.searchParams.set("client_reference_id", `${program}-${residency}`);
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="begin your care"
        title="$199 Membership Evaluation"
        subtitle="Choose your membership and state, then continue to secure Stripe checkout. Required medical intake forms and membership consents are completed through SimplePractice."
      />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="bg-secondary p-7 md:p-10">
          <h2 className="font-serif text-3xl">Step 1: Choose your membership</h2>
          <p className="mt-4 text-muted-foreground">
            The one-time $199 evaluation includes comprehensive baseline bloodwork and a telehealth consultation. It does not guarantee acceptance into a membership or a prescription.
          </p>

          <label htmlFor="program" className="mt-8 block text-sm font-medium">Membership you're interested in</label>
          <select id="program" value={program} onChange={(event) => setProgram(event.target.value)} className="mt-2 w-full border border-border bg-background p-3">
            <option value="">Select a membership</option>
            {programs.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
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
            <p><strong className="text-foreground">Quest lab order:</strong> Generally emailed within 24 hours after successful payment, excluding weekends and holidays. You must schedule your own Quest Diagnostics appointment.</p>
            <p><strong className="text-foreground">Telehealth:</strong> Complete your required bloodwork before your telehealth appointment, which must be scheduled within 60 days of purchase.</p>
            <p><strong className="text-foreground">Additional testing:</strong> Your clinician may require additional bloodwork at an additional cost.</p>
            <p><strong className="text-foreground">Evaluation fee:</strong> After payment and issuance of the lab order, the evaluation fee is nonrefundable except where required by law.</p>
          </div>

          <label className="mt-7 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1" />
            <span>I have reviewed the evaluation, lab scheduling, eligibility, and fee information above. This acknowledgment is not a substitute for the medical intake forms or membership consents completed through SimplePractice.</span>
          </label>

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="font-serif text-2xl">What happens next</h3>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>1. Pay the one-time $199 evaluation fee through Stripe.</li>
              <li>2. Watch your email for your Quest lab order, generally within 24 hours, excluding weekends and holidays.</li>
              <li>3. Schedule your own Quest Diagnostics appointment and complete your bloodwork.</li>
              <li>4. Complete required intake forms and membership consents through SimplePractice, then attend your telehealth evaluation.</li>
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">Do not enter medical history or other health information in Stripe checkout. Medical intake and membership consents are handled through SimplePractice. Membership and prescriptions are subject to medical approval.</p>
            <button
              type="button"
              disabled={!selectionValid}
              onClick={() => window.location.assign(checkoutUrl.toString())}
              className="mt-5 inline-flex bg-ink px-6 py-4 text-xs uppercase tracking-[0.16em] text-primary-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue to secure $199 payment
            </button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
