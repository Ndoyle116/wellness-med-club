import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Syringe, Scale, HeartPulse, ShieldCheck, Clock, Stethoscope, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import photoAsset from "@/assets/photos/injection-tracker.jpg";

export const Route = createFileRoute("/medical-weight-loss")({
  head: () => ({
    meta: [
      { title: "Medical Weight Loss — GLP-1 Therapy | Wellness Med Club" },
      {
        name: "description",
        content:
          "Clinician-guided GLP-1 weight management therapy with Semaglutide and Tirzepatide. Intake, labs, provider review, and home delivery for Florida and Nevada residents.",
      },
      { property: "og:title", content: "Medical Weight Loss — GLP-1 Therapy" },
      {
        property: "og:description",
        content:
          "Compounded Semaglutide and Tirzepatide with provider oversight. FL and NV residents.",
      },
      { property: "og:image", content: photoAsset },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: photoAsset },
    ],
  }),
  component: MedicalWeightLossPage,
});

const BENEFITS = [
  { icon: Scale, title: "Meaningful, sustained weight loss", body: "GLP-1 receptor agonists help regulate appetite, slow gastric emptying, and improve satiety — supporting durable changes to body composition." },
  { icon: HeartPulse, title: "Metabolic health support", body: "Beyond the scale, GLP-1 therapy is associated with improvements in A1C, blood pressure, and cardiovascular risk markers." },
  { icon: Stethoscope, title: "Clinician-guided dosing", body: "A licensed provider reviews your intake, labs, and history to select the right molecule and titration schedule for your goals." },
  { icon: ShieldCheck, title: "Licensed compounding pharmacies", body: "Your prescription is dispensed by licensed 503A or 503B compounding pharmacies with cold-chain shipping direct to your door." },
];

function MedicalWeightLossPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="medical weight loss"
        title="GLP-1 weight management therapy"
        subtitle="Compounded Semaglutide and Tirzepatide, prescribed and monitored by a licensed provider. Available to residents of Florida and Nevada."
      />

      <section id="get-started" className="bg-cream border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="text-center mb-8">
            <div className="divider-script mb-2">get started</div>
            <h2 className="font-serif text-3xl md:text-4xl">See if GLP-1 is right for you</h2>
            <p className="mt-3 text-muted-foreground">A short pre-screen — takes about a minute.</p>
          </div>
          <StepForm />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-10">
          <div className="divider-script mb-2">why GLP-1</div>
          <h2 className="font-serif text-3xl md:text-4xl">More than a weight loss shot</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="bg-background border border-border p-6">
                <Icon className="h-6 w-6 text-accent" />
                <h3 className="font-serif text-lg mt-4">{b.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{b.body}</p>
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
                <li>Treatment approval is not guaranteed and is at the discretion of the reviewing provider.</li>
                <li>Most orders are reviewed within 24 business hours, excluding weekends and holidays.</li>
                <li>Pharmacy processing and shipping times are outside of Wellness Med Club's control.</li>
                <li>Payment does not guarantee approval; all sales are final once payment is processed.</li>
                <li>GLP-1 therapy is not appropriate for everyone. Contraindications include personal or family history of medullary thyroid carcinoma, MEN 2, pregnancy, and certain GI conditions.</li>
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

type FormState = {
  residency: State;
  heightFt: string;
  heightIn: string;
  weightLbs: string;
  priorGlp1: "" | "yes" | "no";
  goalLbs: string;
  contraindications: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const initial: FormState = {
  residency: "",
  heightFt: "",
  heightIn: "",
  weightLbs: "",
  priorGlp1: "",
  goalLbs: "",
  contraindications: [],
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

const CONTRA_OPTIONS = [
  "Personal/family history of medullary thyroid carcinoma",
  "Multiple Endocrine Neoplasia type 2 (MEN 2)",
  "Pregnant, breastfeeding, or planning pregnancy",
  "History of pancreatitis",
  "History of severe GI disease (gastroparesis, IBD)",
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
  const [bmiAcknowledged, setBmiAcknowledged] = useState(false);

  const bmi = useMemo(() => {
    const ft = parseInt(f.heightFt || "0", 10);
    const inch = parseInt(f.heightIn || "0", 10);
    const lbs = parseFloat(f.weightLbs || "0");
    const totalIn = ft * 12 + inch;
    if (!totalIn || !lbs) return null;
    return +((lbs / (totalIn * totalIn)) * 703).toFixed(1);
  }, [f.heightFt, f.heightIn, f.weightLbs]);

  const bmiBelowThreshold = bmi !== null && bmi < 25;

  useEffect(() => {
    if (!bmiBelowThreshold) setBmiAcknowledged(false);
  }, [bmiBelowThreshold]);

  const disqualified = f.residency === "OTHER";
  const contraindicated =
    f.contraindications.length > 0 && !(f.contraindications.length === 1 && f.contraindications[0] === "None of the above");

  const totalSteps = 4;

  function next() {
    if (step === 0 && !f.residency) return toast.error("Select your state of residence.");
    if (step === 1) {
      if (!f.heightFt || !f.weightLbs) return toast.error("Enter your height and weight.");
      if (bmiBelowThreshold && !bmiAcknowledged) return toast.error("Please acknowledge the BMI criteria to continue.");
    }
    if (step === 2 && f.contraindications.length === 0) return toast.error("Check the boxes that apply, or select None.");
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

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
    return <Result state={f} bmi={bmi} contraindicated={contraindicated} />;
  }

  return (
    <div className="bg-background border border-border p-6 md:p-8">
      <Progress current={step} total={totalSteps} />

      <form onSubmit={submit} className="mt-8 space-y-6">
        {step === 0 && (
          <fieldset>
            <legend className="font-serif text-xl">Where do you live?</legend>
            <p className="text-sm text-muted-foreground mt-1">We currently serve Florida and Nevada residents only.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["FL", "NV", "OTHER"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setF({ ...f, residency: v })}
                  className={`border p-3 text-sm uppercase tracking-[0.2em] transition-colors ${
                    f.residency === v ? "bg-ink text-primary-foreground border-ink" : "border-border hover:border-accent"
                  }`}
                >
                  {v === "OTHER" ? "Other" : v}
                </button>
              ))}
            </div>
            {disqualified && (
              <div className="mt-4 flex items-start gap-2 border border-accent/40 bg-accent/5 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span>We can't prescribe outside FL or NV right now. You may still browse our catalog for education.</span>
              </div>
            )}
          </fieldset>
        )}

        {step === 1 && (
          <fieldset>
            <legend className="font-serif text-xl">Basic measurements</legend>
            <p className="text-sm text-muted-foreground mt-1">Used to estimate your BMI.</p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Height (ft)"><input inputMode="numeric" value={f.heightFt} onChange={(e) => setF({ ...f, heightFt: e.target.value.replace(/\D/g, "") })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent" /></Field>
              <Field label="Height (in)"><input inputMode="numeric" value={f.heightIn} onChange={(e) => setF({ ...f, heightIn: e.target.value.replace(/\D/g, "") })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent" /></Field>
              <Field label="Weight (lbs)"><input inputMode="numeric" maxLength={3} value={f.weightLbs} onChange={(e) => setF({ ...f, weightLbs: e.target.value.replace(/\D/g, "") })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent" /></Field>
              <Field label="Goal weight (lbs)"><input inputMode="numeric" maxLength={3} value={f.goalLbs} onChange={(e) => setF({ ...f, goalLbs: e.target.value.replace(/\D/g, "") })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent" /></Field>
            </div>
            <div className="mt-4 grid md:grid-cols-2 gap-3 items-end">
              <Field label="Prior GLP-1 use?">
                <div className="grid grid-cols-2 gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setF({ ...f, priorGlp1: v })}
                      className={`border py-2 text-xs uppercase tracking-[0.2em] ${f.priorGlp1 === v ? "bg-ink text-primary-foreground border-ink" : "border-border hover:border-accent"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </Field>
              {bmi !== null && (
                <div className="text-sm text-muted-foreground">
                  Estimated BMI: <span className="font-serif text-xl text-foreground">{bmi}</span>
                </div>
              )}
            </div>
            {bmiBelowThreshold && (
              <div className="mt-4 border border-accent/40 bg-accent/5 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="bmi-acknowledge"
                    checked={bmiAcknowledged}
                    onCheckedChange={(v) => setBmiAcknowledged(v === true)}
                    aria-describedby="bmi-acknowledge-text"
                  />
                  <Label htmlFor="bmi-acknowledge" className="text-sm leading-relaxed cursor-pointer" id="bmi-acknowledge-text">
                    I acknowledge that although my BMI may be below the standard criteria for GLP-1 therapy, treatment may be prescribed based on other medical needs, such as insulin resistance, metabolic health, inflammation, or hormone-related concerns.
                  </Label>
                </div>
              </div>
            )}
          </fieldset>
        )}

        {step === 2 && (
          <fieldset>
            <legend className="font-serif text-xl">Safety screening</legend>
            <p className="text-sm text-muted-foreground mt-1">Check any that apply to you.</p>
            <div className="mt-4 space-y-2">
              {CONTRA_OPTIONS.map((opt) => {
                const checked = f.contraindications.includes(opt);
                return (
                  <label key={opt} className="flex items-start gap-3 border border-border p-3 cursor-pointer hover:border-accent">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const isNone = opt === "None of the above";
                        setF((prev) => {
                          if (e.target.checked) {
                            return { ...prev, contraindications: isNone ? [opt] : [...prev.contraindications.filter((c) => c !== "None of the above"), opt] };
                          }
                          return { ...prev, contraindications: prev.contraindications.filter((c) => c !== opt) };
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
                <span>Your responses suggest a potential contraindication. A provider consult is required before we can prescribe.</span>
              </div>
            )}
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <legend className="font-serif text-xl">Your contact info</legend>
            <p className="text-sm text-muted-foreground mt-1">We'll email your pre-screen summary and next steps.</p>
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <Field label="First name"><input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent" maxLength={60} /></Field>
              <Field label="Last name"><input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent" maxLength={60} /></Field>
              <Field label="Email"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent" maxLength={200} /></Field>
              <Field label="Phone"><input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent" maxLength={30} /></Field>
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
            <button type="button" onClick={next} className="inline-flex items-center gap-2 bg-ink text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.2em] hover:bg-accent transition-colors">
              Continue <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button type="submit" className="inline-flex items-center gap-2 bg-ink text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.2em] hover:bg-accent transition-colors">
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
        <div key={i} className={`h-1 flex-1 ${i <= current ? "bg-accent" : "bg-border"}`} />
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
      <span className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

function Result({ state, bmi, contraindicated }: { state: FormState; bmi: number | null; contraindicated: boolean }) {
  const ineligible = state.residency === "OTHER";
  return (
    <div className="bg-background border border-border p-6 md:p-8">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-6 w-6 text-accent shrink-0 mt-1" />
        <div>
          <h3 className="font-serif text-2xl">Thanks, {state.firstName || "there"}.</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Here's a snapshot of your pre-screen. A member of our team will follow up at {state.email || "your email"}.
          </p>
        </div>
      </div>

      <dl className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
        <Row k="Residency" v={state.residency || "—"} />
        <Row k="BMI (est.)" v={bmi ? String(bmi) : "—"} />
        <Row k="Prior GLP-1 use" v={state.priorGlp1 || "—"} />
        <Row k="Goal weight" v={state.goalLbs ? `${state.goalLbs} lbs` : "—"} />
      </dl>

      <div className="mt-6 border border-border p-5">
        {ineligible ? (
          <>
            <div className="eyebrow">not eligible</div>
            <h4 className="font-serif text-xl mt-1">We currently prescribe in FL and NV only</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Feel free to browse our catalog to learn more. We'll email you if we open in your state.
            </p>
          </>
        ) : contraindicated ? (
          <>
            <div className="eyebrow">consult required</div>
            <h4 className="font-serif text-xl mt-1">Let's talk before you order</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Based on your responses, a 15-minute tele-visit is required so a provider can review your history.
            </p>
            <Link to="/telehealth" className="mt-4 inline-block bg-ink text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.22em] hover:bg-accent">
              Book a tele-visit
            </Link>
          </>
        ) : (
          <>
            <div className="eyebrow">recommended next step</div>
            <h4 className="font-serif text-xl mt-1">You look like a candidate for GLP-1 therapy</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Browse Semaglutide or Tirzepatide, complete intake and consents at checkout, and a provider will review your file within 24 business hours.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/products" className="bg-ink text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.22em] hover:bg-accent">
                Browse GLP-1 products
              </Link>
              <Link to="/telehealth" className="border border-ink px-5 py-2 text-xs uppercase tracking-[0.22em] hover:bg-ink hover:text-primary-foreground">
                Talk to a provider first
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border py-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
