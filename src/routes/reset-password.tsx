import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — Wellness Med Club" },
      { name: "description", content: "Choose a new password for your Wellness Med Club patient account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Supabase delivers the recovery session via URL hash; the client picks it up
  // automatically. Wait for an authenticated session before allowing a change.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return setError(err.message);
    setDone(true);
    setTimeout(() => navigate({ to: "/account" }), 1200);
  };

  return (
    <SiteLayout>
      <PageHero eyebrow="patient portal" title="Set a new password" />
      <section className="mx-auto max-w-md px-6 py-16">
        {!ready ? (
          <div className="bg-background border border-border p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" />
            Verifying your reset link…
          </div>
        ) : done ? (
          <div className="bg-background border border-border p-8 text-center space-y-2">
            <h2 className="font-serif text-2xl">Password updated</h2>
            <p className="text-sm text-muted-foreground">Redirecting to your account…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5 bg-background border border-border p-8">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">New password</label>
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
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Confirm password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              Update password
            </button>
          </form>
        )}
      </section>
    </SiteLayout>
  );
}
