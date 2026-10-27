import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Mail, Phone, MapPin, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Wellness Med Club" },
      { name: "description", content: "Reach Wellness Med Club. Email, phone, and inquiry form for prospective patients in Florida and Nevada." },
      { property: "og:title", content: "Contact — Wellness Med Club" },
      { property: "og:description", content: "Get in touch with Wellness Med Club." },
    ],
  }),
  component: ContactPage,
});

type ContactForm = {
  name: string;
  email: string;
  phone: string;
  residency_state: string;
  message: string;
};

const emptyForm: ContactForm = { name: "", email: "", phone: "", residency_state: "", message: "" };

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState<ContactForm>(emptyForm);

  const setField = (key: keyof ContactForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from("contact_inquiries").insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        residency_state: form.residency_state || null,
        message: form.message.trim(),
      });
      if (error) throw error;
      setForm(emptyForm);
      setSubmitted(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "We couldn't send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };


  return (
    <SiteLayout>
      <PageHero eyebrow="get in touch" title="We'd love to hear from you." subtitle="Reach out with questions about our services, products, or eligibility." />

      <section className="mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-[1fr_1.2fr] gap-16">
        <div className="space-y-8">
          <div>
            <div className="eyebrow mb-3">Contact</div>
            <h2 className="text-3xl font-serif">Reach the practice</h2>
          </div>
          <ul className="space-y-6">
            <li className="flex items-start gap-4">
              <Mail className="h-5 w-5 text-accent mt-1" />
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</div>
                <a href="mailto:Appointments@wellnessmedclub.com" className="text-foreground hover:text-accent">Appointments@wellnessmedclub.com</a>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <Phone className="h-5 w-5 text-accent mt-1" />
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Phone</div>
                <div className="flex flex-col">
                  <a href="tel:+17027455228" className="text-foreground hover:text-accent">Nevada: (702) 745-5228</a>
                  <a href="tel:+14079555406" className="text-foreground hover:text-accent">Florida: (407) 955-5406</a>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <MapPin className="h-5 w-5 text-accent mt-1" />
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Service Area</div>
                <div>Florida & Nevada (Telehealth)</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <Clock className="h-5 w-5 text-accent mt-1" />
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Response Time</div>
                <div>Within 24 business hours</div>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-secondary p-8 md:p-12">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="font-script text-4xl text-accent mb-2">Thank you</div>
              <h3 className="font-serif text-2xl">Your message has been received.</h3>
              <p className="mt-3 text-muted-foreground max-w-sm">
                We'll respond within 24 business hours. For urgent matters, please call (702) 745-5228 (NV) or (407) 955-5406 (FL).
              </p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={submit}>
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Name</label>
                <input
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-accent"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Email</label>
                  <input
                    required
                    type="email"
                    maxLength={200}
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Phone</label>
                  <input
                    type="tel"
                    maxLength={30}
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">State of Residence</label>
                <select
                  required
                  value={form.residency_state}
                  onChange={(e) => setField("residency_state", e.target.value)}
                  className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-accent"
                >
                  <option value="">Select…</option>
                  <option>Florida</option>
                  <option>Nevada</option>
                  <option>Other (not currently served)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">How can we help?</label>
                <textarea
                  required
                  maxLength={2000}
                  rows={5}
                  value={form.message}
                  onChange={(e) => setField("message", e.target.value)}
                  className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-accent resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-ink text-primary-foreground px-6 py-4 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                {sending ? "Sending…" : "Send Message"}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                This form is for general inquiries only — please do not include sensitive medical information.
              </p>
            </form>
          )}

        </div>
      </section>
    </SiteLayout>
  );
}
