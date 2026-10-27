import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatPrice } from "@/lib/cart-context";
import { Loader2, Video, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Product = Omit<Database["public"]["Tables"]["products"]["Row"], "pharmacy">;

export const Route = createFileRoute("/telehealth")({
  head: () => ({
    meta: [
      { title: "Zoom Call with Provider — Wellness Med Club" },
      {
        name: "description",
        content:
          "Book a 30-minute Zoom call with a Wellness Med Club medical practitioner for lab review, treatment planning, or follow-up care.",
      },
      { property: "og:title", content: "Zoom Call with Provider — Wellness Med Club" },
      {
        property: "og:description",
        content: "Book a 30-minute Zoom call with a Wellness Med Club medical practitioner.",
      },
    ],
  }),
  component: TelehealthPage,
});


function TelehealthPage() {
  const { add } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    supabase
      .from("products")
      .select(
        "id, slug, name, category, description, intended_use, risks, price_cents, requires_labs, requires_consultation, is_controlled, active, image_url, requires_appointment, supplies_available, supplies_price_cents, telehealth_addon_available, telehealth_addon_price_cents, refills_allowed, refill_note, repeat_labs_interval, bac_water_available, bac_water_price_cents, purchase_ack_text, promo_excluded, created_at, updated_at",
      )
      .eq("slug", "visit-telehealth-30")
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => setProduct(data));
  }, []);

  if (product === undefined) {
    return (
      <SiteLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  if (product === null) {
    return (
      <SiteLayout>
        <PageHero eyebrow="zoom call" title="Currently unavailable" />
        <div className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-muted-foreground">
          Zoom calls with a provider aren't available for booking right now. Please{" "}
          <Link to="/contact" className="underline">
            contact us
          </Link>
          .
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="zoom call"
        title="30-minute Zoom call with provider"
        subtitle="One-on-one Zoom video (or phone) call with a licensed Wellness Med Club medical practitioner."
      />


      <section className="mx-auto max-w-4xl px-6 py-12 grid md:grid-cols-2 gap-10">
        <div>
          <div className="border border-border p-6">
            <div className="flex items-center justify-between">
              <Video className="h-6 w-6 text-accent" />
              <span className="font-serif text-3xl">{formatPrice(product.price_cents)}</span>
            </div>
            <h2 className="mt-4 font-serif text-2xl">{product.name}</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{product.description}</p>

            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex gap-2 items-start">
                <Clock className="h-4 w-4 text-accent mt-0.5" />
                30 minutes on Zoom (or by phone)
              </li>
              <li className="flex gap-2 items-start">
                <Shield className="h-4 w-4 text-accent mt-0.5" />
                Includes review of any recent labs or intake information
              </li>
              <li className="flex gap-2 items-start">
                <Video className="h-4 w-4 text-accent mt-0.5" />
                Zoom link emailed after checkout
              </li>

            </ul>

            {product.intended_use && (
              <div className="mt-6 border-t border-border pt-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
                  What it's for
                </div>
                <p className="text-sm text-muted-foreground">{product.intended_use}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-serif text-xl mb-2">Book your call</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Two quick steps: choose your time at checkout, then pay. About a minute total.
          </p>

          <button
            onClick={() => {
              add({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                category: product.category,
                priceCents: product.price_cents,
                requiresConsultation: product.requires_consultation,
                requiresLabs: product.requires_labs,
                isControlled: product.is_controlled,
                requiresAppointment: false,
              });
              toast.success("Zoom call added to cart");
              navigate({ to: "/checkout" });
            }}
            className="w-full bg-ink text-primary-foreground px-6 py-4 text-xs uppercase tracking-[0.22em] hover:bg-accent"
          >
            Book now — {formatPrice(product.price_cents)}
          </button>

          <ol className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li>1. Pick your 30-minute time slot at checkout.</li>
            <li>2. Pay securely.</li>
            <li>3. Zoom link is emailed to you before the call.</li>
          </ol>


          <p className="mt-4 text-xs text-muted-foreground">
            You'll sign in or create an account at checkout if needed.
          </p>
        </div>

      </section>
    </SiteLayout>
  );
}
