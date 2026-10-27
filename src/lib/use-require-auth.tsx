import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * Shared sign-in guard for patient portal pages.
 * Redirects signed-out visitors to /login with a return path.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || user) return;
    const redirect =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : undefined;
    navigate({
      to: "/login",
      search: redirect ? { redirect } : {},
      replace: true,
    });
  }, [loading, user, navigate]);

  return { user, loading, ready: !loading && !!user };
}

/** Full-height spinner used while the portal resolves the session. */
export function PortalLoading() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Small inline error + retry block for failed portal data loads. */
export function PortalError({
  message = "We couldn't load this right now.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="border border-border bg-secondary/40 p-5 text-sm">
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 inline-block text-xs uppercase tracking-[0.18em] font-semibold border-b border-foreground pb-0.5 hover:text-accent hover:border-accent"
        >
          Try again
        </button>
      )}
    </div>
  );
}
