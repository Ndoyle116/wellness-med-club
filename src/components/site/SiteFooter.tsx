import { Link } from "@tanstack/react-router";
import { Mail, Phone, Instagram, Facebook } from "lucide-react";
import logo from "@/assets/wellness-med-club-logo.png";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-primary-foreground mt-24">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <img src={logo} alt="Wellness Med Club" className="h-20 w-auto invert brightness-0" style={{ filter: "invert(1) brightness(2)" }} />
          <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed">
            A nurse practitioner–led practice specializing in medical weight loss,
            peptide therapy, and personalized wellness.
          </p>
          <div className="mt-5 flex gap-3">
            <a href="#" aria-label="Facebook" className="p-2 border border-primary-foreground/20 hover:border-accent hover:text-accent transition-colors">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="p-2 border border-primary-foreground/20 hover:border-accent hover:text-accent transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.22em] text-primary-foreground/60 mb-4">Explore</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about" className="opacity-80 hover:opacity-100 hover:text-accent">About</Link></li>
            <li><Link to="/services" className="opacity-80 hover:opacity-100 hover:text-accent">Treatment Programs</Link></li>
            <li><Link to="/products" className="opacity-80 hover:opacity-100 hover:text-accent">Products</Link></li>
            <li><Link to="/how-it-works" className="opacity-80 hover:opacity-100 hover:text-accent">How It Works</Link></li>
            <li><Link to="/contact" className="opacity-80 hover:opacity-100 hover:text-accent">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.22em] text-primary-foreground/60 mb-4">Contact</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href="mailto:Appointments@wellnessmedclub.com" className="flex items-center gap-2 opacity-80 hover:opacity-100">
                <Mail className="h-4 w-4" /> Appointments@wellnessmedclub.com
              </a>
            </li>
            <li>
              <a href="tel:+17027455228" className="flex items-center gap-2 opacity-80 hover:opacity-100">
                <Phone className="h-4 w-4" /> NV (702) 745-5228
              </a>
            </li>
            <li>
              <a href="tel:+14079555406" className="flex items-center gap-2 opacity-80 hover:opacity-100">
                <Phone className="h-4 w-4" /> FL (407) 955-5406
              </a>
            </li>
            <li className="opacity-80">Serving Florida & Nevada</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.22em] text-primary-foreground/60 mb-4">Disclaimer</h4>
          <p className="text-xs leading-relaxed text-primary-foreground/60">
            Information on this site is for educational purposes only and is not a
            substitute for professional medical advice. Treatment is available
            only to residents of FL and NV pending eligibility, intake review,
            and clinician approval.
          </p>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/50">
          <span>© {new Date().getFullYear()} Wellness Med Club. All rights reserved.</span>
          <span>Nicole Doyle, APRN</span>
        </div>
      </div>
    </footer>
  );
}
