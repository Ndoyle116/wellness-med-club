import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Wellness Med Club" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    else if (!loading && user && !isStaff) navigate({ to: "/account" });
  }, [loading, user, isStaff, navigate]);

  if (loading || !user || !isStaff) {
    return (
      <div className="min-h-screen grid place-items-center bg-secondary/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <Outlet />;
}
