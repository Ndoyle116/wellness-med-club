import { Link } from "@tanstack/react-router";
import { Mail, Phone, Menu, X, User as UserIcon, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/wellness-med-club-logo.png";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Treatment Programs" },
  { to: "/products", label: "Products" },
  { to: "/telehealth", label: "Zoom Call w/ Provider" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/contact", label: "Contact" },
] as const;


export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, isStaff } = useAuth();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
      <div className="hidden md:block bg-ink text-primary-foreground text-xs">
        <div className="mx-auto max-w-7xl px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="mailto:Appointments@wellnessmedclub.com" className="flex items-center gap-2 opacity-90 hover:opacity-100">
              <Mail className="h-3.5 w-3.5" />
              <span>Appointments@wellnessmedclub.com</span>
            </a>
            <a href="tel:+17027455228" className="flex items-center gap-2 opacity-90 hover:opacity-100">
              <Phone className="h-3.5 w-3.5" />
              <span>NV (702) 745-5228</span>
            </a>
            <a href="tel:+14079555406" className="flex items-center gap-2 opacity-90 hover:opacity-100">
              <Phone className="h-3.5 w-3.5" />
              <span>FL (407) 955-5406</span>
            </a>
          </div>
          <span className="opacity-70">Serving Florida & Nevada</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Wellness Med Club">
          <img src={logo} alt="Wellness Med Club" className="h-14 w-auto xl:h-16" />
        </Link>

        <nav className="hidden lg:flex min-w-0 flex-1 items-center justify-center gap-5 xl:gap-7">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap text-[13px] xl:text-sm tracking-wide text-foreground/80 hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground font-medium" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          {isStaff && (
            <Link
              to="/admin"
              className="whitespace-nowrap text-[13px] xl:text-sm tracking-wide text-accent hover:text-foreground transition-colors"
              activeProps={{ className: "font-medium" }}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden lg:flex shrink-0 items-center gap-2">
          <NotificationBell audience="patient" />
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative inline-flex items-center justify-center p-2.5 hover:text-accent transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-primary-foreground text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <Link
              to="/account"
              className="inline-flex items-center gap-2 whitespace-nowrap border border-border px-3 py-2.5 text-[11px] uppercase tracking-[0.16em] hover:border-accent hover:text-accent transition-colors"
            >
              <UserIcon className="h-3.5 w-3.5" /> Account
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center whitespace-nowrap px-3 py-2.5 text-[11px] uppercase tracking-[0.16em] hover:text-accent transition-colors"
            >
              Sign In
            </Link>
          )}
          <Link
            to={user ? "/products" : "/signup"}
            className="inline-flex items-center whitespace-nowrap bg-ink text-primary-foreground px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] hover:bg-accent transition-colors"
          >
            {user ? "Shop" : "Get Started"}
          </Link>
        </div>

        <button
          className="lg:hidden p-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="flex flex-col px-6 py-4 gap-4">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="text-sm tracking-wide text-foreground/80"
                activeProps={{ className: "text-foreground font-medium" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            {isStaff && (
              <Link to="/admin" onClick={() => setOpen(false)} className="text-sm text-accent">
                Admin
              </Link>
            )}
            {user ? (
              <Link to="/account" onClick={() => setOpen(false)} className="text-sm">
                My Account
              </Link>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="text-sm">
                Sign In
              </Link>
            )}
            <Link
              to={user ? "/products" : "/signup"}
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center bg-ink text-primary-foreground px-6 py-3 text-xs uppercase tracking-[0.2em]"
            >
              {user ? "Shop" : "Get Started"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
