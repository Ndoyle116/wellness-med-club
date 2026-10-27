import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type IntakeSearch = { redirect?: string };

export const Route = createFileRoute("/account_/intake")({
  head: () => ({ meta: [{ title: "Medical Intake — Wellness Med Club" }] }),
  validateSearch: (s: Record<string, unknown>): IntakeSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: IntakePage,
});

const intakeSchema = z.object({
  residency_state: z.enum(["FL", "NV"]),
  date_of_birth: z.string().min(1, "Required"),
  phone: z.string().trim().min(7, "Phone required").max(40),
  current_medications: z.string().max(2000).optional(),
  allergies: z.string().max(2000).optional(),
  medical_history: z.string().max(4000).optional(),
  is_pregnant_or_nursing: z.boolean(),
  has_cardiac_condition: z.boolean(),
  has_endocrine_condition: z.boolean(),
  has_cancer_history: z.boolean(),
  attestation_signed: z.literal(true, {
    errorMap: () => ({ message: "You must attest to continue" }),
  }),
});

type FormState = {
  residency_state: "FL" | "NV" | "";
  date_of_birth: string;
  phone: string;
  current_medications: string;
  allergies: string;
  medical_history: string;
  is_pregnant_or_nursing: boolean;
  has_cardiac_condition: boolean;
  has_endocrine_condition: boolean;
  has_cancer_history: boolean;
  attestation_signed: boolean;
};

const empty: FormState = {
  residency_state: "",
  date_of_birth: "",
  phone: "",
  current_medications: "",
  allergies: "",
  medical_history: "",
  is_pregnant_or_nursing: false,
  has_cardiac_condition: false,
  has_endocrine_condition: false,
  has_cancer_history: false,
  attestation_signed: false,
};

function IntakePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/account_/intake" });
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("intake_responses")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setExistingId(data.id);
        setForm({
          residency_state: (data.residency_state as "FL" | "NV") ?? "",
          date_of_birth: "",
          phone: "",
          current_medications: data.current_medications ?? "",
          allergies: data.allergies ?? "",
          medical_history: data.medical_history ?? "",
          is_pregnant_or_nursing: data.is_pregnant_or_nursing ?? false,
          has_cardiac_condition: data.has_cardiac_condition ?? false,
          has_endocrine_condition: data.has_endocrine_condition ?? false,
          has_cancer_history: data.has_cancer_history ?? false,
          attestation_signed: data.attestation_signed ?? false,
        });
        // Pull DOB / phone from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("date_of_birth, phone")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile) {
          setForm((f) => ({
            ...f,
            date_of_birth: profile.date_of_birth ?? "",
            phone: profile.phone ?? "",
          }));
        }
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("date_of_birth, phone, residency_state")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile) {
          setForm((f) => ({
            ...f,
            date_of_birth: profile.date_of_birth ?? "",
            phone: profile.phone ?? "",
            residency_state: (profile.residency_state as "FL" | "NV") ?? "",
          }));
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrors({});
    const parsed = intakeSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errs[issue.path.join(".")] = issue.message;
      }
      setErrors(errs);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      // Upsert profile basics
      const { error: pErr } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            date_of_birth: parsed.data.date_of_birth,
            phone: parsed.data.phone,
            residency_state: parsed.data.residency_state,
          },
          { onConflict: "user_id" },
        );
      if (pErr) throw pErr;

      const payload = {
        user_id: user.id,
        residency_state: parsed.data.residency_state,
        current_medications: parsed.data.current_medications ?? null,
        allergies: parsed.data.allergies ?? null,
        medical_history: parsed.data.medical_history ?? null,
        is_pregnant_or_nursing: parsed.data.is_pregnant_or_nursing,
        has_cardiac_condition: parsed.data.has_cardiac_condition,
        has_endocrine_condition: parsed.data.has_endocrine_condition,
        has_cancer_history: parsed.data.has_cancer_history,
        attestation_signed: true,
        attestation_signed_at: new Date().toISOString(),
      };

      if (existingId) {
        const { error } = await supabase
          .from("intake_responses")
          .update(payload)
          .eq("id", existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("intake_responses").insert(payload);
        if (error) throw error;
      }
      toast.success("Intake saved");
      if (redirect) {
        navigate({ to: redirect });
      } else {
        navigate({ to: "/account" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <SiteLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="medical intake"
        title="Tell us about your health"
        subtitle="Required before any provider review. Stored privately and used only to evaluate your order."
      />
      <form onSubmit={onSubmit} className="mx-auto max-w-3xl px-6 pb-20 space-y-10">
        <Section title="Basics">
          <Field label="State of residency" error={errors["residency_state"]}>
            <Select
              value={form.residency_state}
              onValueChange={(v) => set("residency_state", v as "FL" | "NV")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FL">Florida</SelectItem>
                <SelectItem value="NV">Nevada</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date of birth" error={errors["date_of_birth"]}>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => set("date_of_birth", e.target.value)}
            />
          </Field>
          <Field label="Phone" error={errors["phone"]}>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Medical history">
          <Field label="Current medications" error={errors["current_medications"]}>
            <Textarea
              rows={3}
              value={form.current_medications}
              onChange={(e) => set("current_medications", e.target.value)}
              placeholder="List names and dosages, or write 'None'."
            />
          </Field>
          <Field label="Allergies" error={errors["allergies"]}>
            <Textarea
              rows={2}
              value={form.allergies}
              onChange={(e) => set("allergies", e.target.value)}
            />
          </Field>
          <Field label="Relevant medical history" error={errors["medical_history"]}>
            <Textarea
              rows={4}
              value={form.medical_history}
              onChange={(e) => set("medical_history", e.target.value)}
              placeholder="Surgeries, chronic conditions, hospitalizations, etc."
            />
          </Field>
        </Section>

        <Section title="Risk factors">
          <ToggleRow
            label="Currently pregnant or nursing"
            checked={form.is_pregnant_or_nursing}
            onChange={(v) => set("is_pregnant_or_nursing", v)}
          />
          <ToggleRow
            label="Cardiac condition (e.g. heart disease, arrhythmia)"
            checked={form.has_cardiac_condition}
            onChange={(v) => set("has_cardiac_condition", v)}
          />
          <ToggleRow
            label="Endocrine condition (e.g. thyroid, diabetes)"
            checked={form.has_endocrine_condition}
            onChange={(v) => set("has_endocrine_condition", v)}
          />
          <ToggleRow
            label="Personal history of cancer"
            checked={form.has_cancer_history}
            onChange={(v) => set("has_cancer_history", v)}
          />
        </Section>

        <Section title="Attestation">
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={form.attestation_signed}
              onCheckedChange={(v) => set("attestation_signed", v === true)}
              className="mt-0.5"
            />
            <span className="text-muted-foreground leading-relaxed">
              I attest that the information above is accurate to the best of my knowledge and
              understand that omissions may affect the safety of any care provided.
            </span>
          </label>
          {errors["attestation_signed"] && (
            <p className="text-xs text-destructive mt-2">{errors["attestation_signed"]}</p>
          )}
        </Section>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center bg-ink text-primary-foreground px-8 py-3 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save intake"}
          </button>
          <Link
            to="/account"
            className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </SiteLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border p-6 space-y-5">
      <h2 className="font-serif text-2xl">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-sm">{label}</span>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
    </label>
  );
}
