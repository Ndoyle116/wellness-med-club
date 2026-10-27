import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { loginSchema } from "@/lib/validation";
import { Loader2 } from "lucide-react";

// Only accept same-origin absolute paths so a crafted `?redirect=`
// can't bounce the user to an external URL after sign-in.
function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const r = safeRedirect(search.redirect);
    return r ? { redirect: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign In — Wellness Med Club" },
      { name: "description", content: "Sign in to your Wellness Med Club patient account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate({ to: redirect ?? "/account" });
  };

  return (
    <SiteLayout>
      <PageHero eyebrow="patient portal" title="Sign In" subtitle="Access your orders, intake forms, and consultations." />
      <section className="mx-auto max-w-md px-6 py-16">
        <form onSubmit={onSubmit} className="space-y-5 bg-background border border-border p-8">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
            />
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
            Sign In
          </button>
          <div className="flex items-center justify-between pt-1">
            <Link to="/forgot-password" className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground border-b border-transparent hover:border-foreground">
              Forgot password?
            </Link>
            <Link
              to="/signup"
              search={redirect ? { redirect } : {}}
              className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground border-b border-transparent hover:border-foreground"
            >
              Create account
            </Link>
          </div>
        </form>
      </section>
    </SiteLayout>
  );
}
