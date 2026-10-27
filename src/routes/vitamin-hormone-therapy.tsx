import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import {
  Droplet,
  Sparkles,
  HeartPulse,
  ShieldCheck,
  Clock,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

export const Route = createFileRoute("/vitamin-hormone-therapy")({
  head: () => ({
    meta: [
      { title: "Vitamin Therapies & Hormone Optimization | Wellness Med Club" },
      {
        name: "description",
        content:
          "Clinician-guided vitamin injections and hormone optimization — B12, NAD+, glutathione, testosterone, progesterone, estrogen, DHEA. FL and NV residents.",
      },
      { property: "og:title", content: "Vitamin Therapies & Hormone Optimization" },
      {
        property: "og:description",
        content:
          "Vitamin injections and bio-identical hormone therapy with provider oversight. FL and NV residents.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VitaminHormonePage,
});

const BENEFITS = [
  {
    icon: Droplet,
    title: "Micronutrient replenishment",
    body:
      "Injectable B12, B-complex, Vitamin D3, glutathione, and amino blends bypass gut absorption for reliable, therapeutic levels.",
  },
  {
    icon: Sparkles,
    title: "Cellular longevity",
    body:
      "NAD+ injections and nasal sprays support mitochondrial energy, DNA repair, focus, and healthy aging at the cellular level.",
  },
  {
    icon: HeartPulse,
    title: "Balanced hormones",
    body:
      "Bio-identical testosterone, progesterone, estrogen, and DHEA — dosed to your labs and symptoms, not a one-size-fits-all script.",
  },
  {
    icon: ShieldCheck,
    title: "Provider-reviewed",
    body:
      "Every order is reviewed by a licensed clinician. Controlled hormones require labs and periodic telehealth follow-ups per state law.",
  },
];

function VitaminHormonePage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="part 3 — vitamin therapies & hormone optimization"
        title="Vitamin therapies & hormone optimization"
        subtitle="Injectable vitamins, NAD+, glutathione, and bio-identical hormone therapy — prescribed and monitored by a licensed provider. Available to residents of Florida and Nevada."
      />

      <section id="get-started" className="bg-cream border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="text-center mb-8">
            <div className="divider-script mb-2">get started</div>
            <h2 className="font-serif text-3xl md:text-4xl">
              See what protocol fits you
            </h2>
            <p className="mt-3 text-muted-foreground">
              A short pre-screen — takes about a minute.
            </p>
          </div>
          <StepForm />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-10">
          <div className="divider-script mb-2">why vitamin & hormone therapy</div>
          <h2 className="font-serif text-3xl md:text-4xl">
            Feel like yourself again
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="bg-background border border-border p-6">
                <Icon className="h-6 w-6 text-accent" />
                <h3 className="font-serif text-lg mt-4">{b.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {b.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-cream border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-accent shrink-0 mt-1" />
            <div>
              <h3 className="font-serif text-xl">Important acknowledgments</h3>
              <ul className="mt-4 list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li>
                  Treatment approval is not guaranteed and is at the discretion of the
                  reviewing provider.
                </li>
                <li>
                  Most orders are reviewed within 24 business hours, excluding weekends
                  and holidays.
                </li>
                <li>
                  Testosterone and other controlled hormones require recent labs, signed
                  consents, and periodic telehealth follow-ups per state law.
                </li>
                <li>
                  Pharmacy processing and shipping times are outside of Wellness Med
                  Club's control.
                </li>
                <li>
                  Payment does not guarantee approval; all sales are final once payment
                  is processed.
                </li>
                <li>
                  Vitamin and hormone therapy is not appropriate for everyone. A provider
                  will screen for contraindications during review.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

// ---------------- Step Form ----------------

type State = "FL" | "NV" | "OTHER" | "";

type Interest = "vitamins" | "hormone_optimization";

type FormState = {
  residency: State;
  sex: "" | "female" | "male" | "other";
  age: string;
  interests: Interest[];
  recentLabs: "" | "yes" | "no";
  symptoms: string[];
  contraindications: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const initial: FormState = {
  residency: "",
  sex: "",
  age: "",
  interests: [],
  recentLabs: "",
  symptoms: [],
  contraindications: [],
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

const INTEREST_OPTIONS: { id: Interest; label: string; body: string }[] = [
  { id: "vitamins", label: "Vitamins", body: "B12, B-complex, Vitamin D3, Tri-Immune, Glutathione, NAD+, Amino Blend" },
  { id: "hormone_optimization", label: "Hormone optimization", body: "Testosterone, progesterone, estrogen, DHEA, hCG, Clomid, Sermorelin" },
];

const SYMPTOM_OPTIONS = [
  "Fatigue / low energy",
  "Low libido",
  "Brain fog",
  "Sleep issues",
  "Mood changes / irritability",
  "Hot flashes or night sweats",
  "Slow recovery from workouts",
  "Weight/body composition changes",
];

const CONTRA_OPTIONS = [
  "Personal history of hormone-sensitive cancer",
  "Active blood clot or clotting disorder",
  "Pregnant, breastfeeding, or planning pregnancy",
  "Untreated severe cardiovascular disease",
  "Severe liver or kidney disease",
  "None of the above",
];

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(60),
  lastName: z.string().trim().min(1, "Required").max(60),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z.string().trim().min(7, "Enter a valid phone").max(30),
});

function StepForm() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState<FormState>(initial);
  const [submitted, setSubmitted] = useState(false);

  const disqualified = f.residency === "OTHER";
  const contraindicated =
    f.contraindications.length > 0 &&
    !(f.contraindications.length === 1 && f.contraindications[0] === "None of the above");

  const needsLabs = useMemo(
    () => f.interests.includes("hormone_optimization"),
    [f.interests],
  );

  const totalSteps = 5;

  function next() {
    if (step === 0 && !f.residency) return toast.error("Select your state of residence.");
    if (step === 1) {
      if (!f.sex) return toast.error("Select an option.");
      const ageNum = parseInt(f.age || "0", 10);
      if (!ageNum || ageNum < 18 || ageNum > 100)
        return toast.error("Enter a valid age (18+).");
    }
    if (step === 2 && f.interests.length === 0)
      return toast.error("Pick at least one area of interest.");
    if (step === 3 && f.contraindications.length === 0)
      return toast.error("Check the boxes that apply, or select None.");
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(f);
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0]?.message ?? "Check your contact info");
    }
    setSubmitted(true);
    toast.success("Thanks — we saved your pre-screen.");
  }

  if (submitted) {
    return (
      <Result
        state={f}
        needsLabs={needsLabs}
        contraindicated={contraindicated}
      />
    );
  }

  return (
    <div className="bg-background border border-border p-6 md:p-8">
      <Progress current={step} total={totalSteps} />

      <form onSubmit={submit} className="mt-8 space-y-6">
        {step === 0 && (
          <fieldset>
            <legend className="font-serif text-xl">Where do you live?</legend>
            <p className="text-sm text-muted-foreground mt-1">
              We currently serve Florida and Nevada residents only.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["FL", "NV", "OTHER"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setF({ ...f, residency: v })}
                  className={`border p-3 text-sm uppercase tracking-[0.2em] transition-colors ${
                    f.residency === v
                      ? "bg-ink text-primary-foreground border-ink"
                      : "border-border hover:border-accent"
                  }`}
                >
                  {v === "OTHER" ? "Other" : v}
                </button>
              ))}
            </div>
            {disqualified && (
              <div className="mt-4 flex items-start gap-2 border border-accent/40 bg-accent/5 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span>
                  We can't prescribe outside FL or NV right now. You may still browse
                  our catalog for education.
                </span>
              </div>
            )}
          </fieldset>
        )}

        {step === 1 && (
          <fieldset>
            <legend className="font-serif text-xl">About you</legend>
            <p className="text-sm text-muted-foreground mt-1">
              Helps us tailor which protocols to suggest.
            </p>
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <Field label="Sex assigned at birth">
                <div className="grid grid-cols-3 gap-2">
                  {(["female", "male", "other"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setF({ ...f, sex: v })}
                      className={`border py-2 text-xs uppercase tracking-[0.2em] ${
                        f.sex === v
                          ? "bg-ink text-primary-foreground border-ink"
                          : "border-border hover:border-accent"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Age">
                <input
                  inputMode="numeric"
                  value={f.age}
                  onChange={(e) =>
                    setF({ ...f, age: e.target.value.replace(/\D/g, "") })
                  }
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
              </Field>
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset>
            <legend className="font-serif text-xl">What are you interested in?</legend>
            <p className="text-sm text-muted-foreground mt-1">
              Pick any that apply — a provider will refine from there.
            </p>
            <div className="mt-4 space-y-2">
              {INTEREST_OPTIONS.map((opt) => {
                const checked = f.interests.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className="flex items-start gap-3 border border-border p-3 cursor-pointer hover:border-accent"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setF((prev) => ({
                          ...prev,
                          interests: e.target.checked
                            ? [...prev.interests, opt.id]
                            : prev.interests.filter((i) => i !== opt.id),
                        }))
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium">{opt.label}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {opt.body}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-6">
              <Field label="Have you had labs in the last 6–9 months?">
                <div className="grid grid-cols-2 gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setF({ ...f, recentLabs: v })}
                      className={`border py-2 text-xs uppercase tracking-[0.2em] ${
                        f.recentLabs === v
                          ? "bg-ink text-primary-foreground border-ink"
                          : "border-border hover:border-accent"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-6">
              <span className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
                Symptoms (optional)
              </span>
              <div className="grid sm:grid-cols-2 gap-2">
                {SYMPTOM_OPTIONS.map((opt) => {
                  const checked = f.symptoms.includes(opt);
                  return (
                    <label
                      key={opt}
                      className="flex items-center gap-2 border border-border p-2 cursor-pointer hover:border-accent text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setF((prev) => ({
                            ...prev,
                            symptoms: e.target.checked
                              ? [...prev.symptoms, opt]
                              : prev.symptoms.filter((s) => s !== opt),
                          }))
                        }
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <legend className="font-serif text-xl">Safety screening</legend>
            <p className="text-sm text-muted-foreground mt-1">
              Check any that apply to you.
            </p>
            <div className="mt-4 space-y-2">
              {CONTRA_OPTIONS.map((opt) => {
                const checked = f.contraindications.includes(opt);
                return (
                  <label
                    key={opt}
                    className="flex items-start gap-3 border border-border p-3 cursor-pointer hover:border-accent"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const isNone = opt === "None of the above";
                        setF((prev) => {
                          if (e.target.checked) {
                            return {
                              ...prev,
                              contraindications: isNone
                                ? [opt]
                                : [
                                    ...prev.contraindications.filter(
                                      (c) => c !== "None of the above",
                                    ),
                                    opt,
                                  ],
                            };
                          }
                          return {
                            ...prev,
                            contraindications: prev.contraindications.filter(
                              (c) => c !== opt,
                            ),
                          };
                        });
                      }}
                      className="mt-1"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                );
              })}
            </div>
            {contraindicated && (
              <div className="mt-4 flex items-start gap-2 border border-accent/40 bg-accent/5 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span>
                  Your responses suggest a potential contraindication. A provider
                  consult is required before we can prescribe.
                </span>
              </div>
            )}
          </fieldset>
        )}

        {step === 4 && (
          <fieldset>
            <legend className="font-serif text-xl">Your contact info</legend>
            <p className="text-sm text-muted-foreground mt-1">
              We'll email your pre-screen summary and next steps.
            </p>
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <Field label="First name">
                <input
                  value={f.firstName}
                  onChange={(e) => setF({ ...f, firstName: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  maxLength={60}
                />
              </Field>
              <Field label="Last name">
                <input
                  value={f.lastName}
                  onChange={(e) => setF({ ...f, lastName: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  maxLength={60}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  maxLength={200}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  maxLength={30}
                />
              </Field>
            </div>
          </fieldset>
        )}

        <div className="flex justify-between pt-4 border-t border-border">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.2em] border border-border disabled:opacity-40 hover:border-accent"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 bg-ink text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.2em] hover:bg-accent transition-colors"
            >
              Continue <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-ink text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.2em] hover:bg-accent transition-colors"
            >
              See recommendation <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 ${i <= current ? "bg-accent" : "bg-border"}`}
        />
      ))}
      <span className="ml-3 text-xs uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
        Step {current + 1} of {total}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function Result({
  state,
  needsLabs,
  contraindicated,
}: {
  state: FormState;
  needsLabs: boolean;
  contraindicated: boolean;
}) {
  const ineligible = state.residency === "OTHER";
  const interestLabels = INTEREST_OPTIONS.filter((o) =>
    state.interests.includes(o.id),
  )
    .map((o) => o.label)
    .join(", ");

  return (
    <div className="bg-background border border-border p-6 md:p-8">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-6 w-6 text-accent shrink-0 mt-1" />
        <div>
          <h3 className="font-serif text-2xl">
            Thanks, {state.firstName || "there"}.
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Here's a snapshot of your pre-screen. A member of our team will follow up
            at {state.email || "your email"}.
          </p>
        </div>
      </div>

      <dl className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
        <Row k="Residency" v={state.residency || "—"} />
        <Row k="Age" v={state.age || "—"} />
        <Row k="Interests" v={interestLabels || "—"} />
        <Row k="Recent labs" v={state.recentLabs || "—"} />
      </dl>

      <div className="mt-6 border border-border p-5">
        {ineligible ? (
          <>
            <div className="eyebrow">not eligible</div>
            <h4 className="font-serif text-xl mt-1">
              We currently prescribe in FL and NV only
            </h4>
            <p className="text-sm text-muted-foreground mt-2">
              Feel free to browse our catalog to learn more. We'll email you if we
              open in your state.
            </p>
          </>
        ) : contraindicated ? (
          <>
            <div className="eyebrow">consult required</div>
            <h4 className="font-serif text-xl mt-1">Let's talk before you order</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Based on your responses, a 15-minute tele-visit is required so a
              provider can review your history.
            </p>
            <Link
              to="/telehealth"
              className="mt-4 inline-block bg-ink text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.22em] hover:bg-accent"
            >
              Book a tele-visit
            </Link>
          </>
        ) : needsLabs && state.recentLabs !== "yes" ? (
          <>
            <div className="eyebrow">labs recommended</div>
            <h4 className="font-serif text-xl mt-1">
              Let's get baseline labs first
            </h4>
            <p className="text-sm text-muted-foreground mt-2">
              Hormone therapy is dosed to your labs. Order a Quest requisition or
              book a tele-visit to review options.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/products"
                className="bg-ink text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.22em] hover:bg-accent"
              >
                Browse lab panels
              </Link>
              <Link
                to="/telehealth"
                className="border border-ink px-5 py-2 text-xs uppercase tracking-[0.22em] hover:bg-ink hover:text-primary-foreground"
              >
                Talk to a provider
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="eyebrow">recommended next step</div>
            <h4 className="font-serif text-xl mt-1">
              You look like a candidate for vitamin & hormone therapy
            </h4>
            <p className="text-sm text-muted-foreground mt-2">
              Browse our vitamin injections and hormone protocols. Complete intake
              and consents at checkout, and a provider will review your file within
              24 business hours.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/products"
                className="bg-ink text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.22em] hover:bg-accent"
              >
                Browse products
              </Link>
              <Link
                to="/telehealth"
                className="border border-ink px-5 py-2 text-xs uppercase tracking-[0.22em] hover:bg-ink hover:text-primary-foreground"
              >
                Talk to a provider first
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <Stethoscope className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          This pre-screen is not medical advice. Treatment is at the discretion of
          the reviewing provider.
        </span>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border py-2 gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium text-right">{v}</dd>
    </div>
  );
}
