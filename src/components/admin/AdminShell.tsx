import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  CalendarClock,
  LogOut,
  Stethoscope,
  Users,
  ShieldCheck,
  Ticket,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { NotificationBell } from "@/components/NotificationBell";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/approvals", label: "Lab Approvals", icon: ShieldCheck },
  { to: "/admin/refills", label: "Refills", icon: RefreshCw },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/products", label: "Products", icon: Package, adminOnly: true },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket, adminOnly: true },
  { to: "/admin/availability", label: "Availability", icon: CalendarClock },
  { to: "/admin/contact", label: "Contact Inquiries", icon: MessageSquare },
];

export function AdminShell({
  title,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex bg-secondary/30">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-background">
        <div className="px-6 py-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-full bg-ink text-primary-foreground grid place-items-center">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <div className="font-serif text-lg leading-none">Wellness</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-0.5">
                Admin Console
              </div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {items.map((item) => {
            const active =
              item.to === "/admin"
                ? pathname === "/admin"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors ${
                  active
                    ? "bg-ink text-primary-foreground"
                    : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs font-medium truncate">{user?.email ?? ""}</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-0.5">
              {isAdmin ? "Administrator" : "Provider"}
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-destructive rounded-sm hover:bg-secondary"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with logo + nav */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-ink text-primary-foreground grid place-items-center">
              <Stethoscope className="h-3.5 w-3.5" />
            </div>
            <span className="font-serif">Admin</span>
          </Link>
          <button onClick={logout} className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Sign out
          </button>
        </div>
        <div className="lg:hidden flex overflow-x-auto border-b border-border bg-background gap-1 px-2 py-2">
          {items.map((item) => {
            const active =
              item.to === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`shrink-0 px-3 py-1.5 text-xs uppercase tracking-[0.16em] rounded-sm ${
                  active ? "bg-ink text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Page header */}
        <header className="bg-background border-b border-border">
          <div className="px-6 lg:px-10 py-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              {eyebrow && (
                <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
                  {eyebrow}
                </div>
              )}
              <h1 className="font-serif text-3xl leading-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell audience="staff" />
              {actions}
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 lg:px-10 py-8">{children}</main>
      </div>
    </div>
  );
}
