import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { signupSchema } from "@/lib/validation";
import { Loader2 } from "lucide-react";

// Only accept same-origin absolute paths so a crafted `?redirect=` can't bounce
// the user to an external URL after sign-up.
function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const r = safeRedirect(search.redirect);
    return r ? { redirect: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Create Account — Wellness Med Club" },
      { name: "description", content: "Create your patient account to access intake, products, and consultations." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = signupSchema.safeParse({ firstName, lastName, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}${redirect ?? "/account"}`,
        data: {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
        },
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate({ to: redirect ?? "/account" });
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="new patient"
        title="Create Your Account"
        subtitle="Florida and Nevada residents only. You'll complete your medical intake before placing any order."
      />
      <section className="mx-auto max-w-md px-6 py-16">
        <form onSubmit={onSubmit} className="space-y-5 bg-background border border-border p-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">First Name</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirst(e.target.value)}
                className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Last Name</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLast(e.target.value)}
                className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
            />
            <p className="mt-1 text-xs text-muted-foreground">Minimum 8 characters.</p>
          </div>
          {error && (
            <div className="text-sm text-destructive border-l-2 border-destructive pl-3">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-primary-foreground py-3 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account
          </button>
          <p className="text-center text-sm text-muted-foreground pt-2">
            Already have an account?{" "}
            <Link
              to="/login"
              search={redirect ? { redirect } : {}}
              className="text-foreground border-b border-foreground hover:text-accent hover:border-accent"
            >
              Sign in
            </Link>
          </p>
        </form>
        <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
          By creating an account you acknowledge that services are limited to
          residents of Florida and Nevada and that all orders require completion
          of medical intake and applicable consent forms.
        </p>
      </section>
    </SiteLayout>
  );
}
