import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Wellness Med Club" },
      { name: "description", content: "Reset the password for your Wellness Med Club patient account." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const sendReset = async (target: string) => {
    return supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };

  const startCooldown = (seconds: number) => {
    setResendCooldown(seconds);
    const interval = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    const { error: err } = await sendReset(email.trim());
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
    startCooldown(30);
  };

  const onResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setResendNotice(null);
    setLoading(true);
    const { error: err } = await sendReset(email.trim());
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setResendCount((c) => c + 1);
    setResendNotice("Reset email sent again. Please check your inbox and spam folder.");
    startCooldown(30);
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="patient portal"
        title="Reset your password"
        subtitle="We'll email you a secure link to set a new password."
      />
      <section className="mx-auto max-w-md px-6 py-16">
        {sent ? (
          <div className="bg-background border border-border p-8 text-center space-y-5">
            <h2 className="font-serif text-2xl">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="text-foreground">{email}</span>, a reset link is on its way.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn't get it? Check your spam folder, then try resending.
            </p>
            {resendNotice && (
              <div className="text-xs text-foreground border-l-2 border-accent pl-3 text-left">
                {resendNotice}
                {resendCount > 0 && <span className="block text-muted-foreground mt-1">Sent {resendCount + 1} times.</span>}
              </div>
            )}
            {error && (
              <div className="text-sm text-destructive border-l-2 border-destructive pl-3 text-left">{error}</div>
            )}
            <button
              type="button"
              onClick={onResend}
              disabled={loading || resendCooldown > 0}
              className="w-full bg-ink text-primary-foreground py-3 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend password reset email"}
            </button>
            <Link to="/login" className="inline-block text-xs uppercase tracking-[0.22em] underline">
              Back to sign in
            </Link>
          </div>
        ) : (
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
            {error && (
              <div className="text-sm text-destructive border-l-2 border-destructive pl-3">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-primary-foreground py-3 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </button>
            <p className="text-center text-sm text-muted-foreground pt-2">
              Remembered it?{" "}
              <Link to="/login" className="text-foreground border-b border-foreground hover:text-accent hover:border-accent">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </section>
    </SiteLayout>
  );
}

