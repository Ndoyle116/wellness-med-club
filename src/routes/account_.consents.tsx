import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import {
  fetchRequiredConsentsForCart,
  fetchRequiredConsentsForProductIds,
  type ConsentRequirement,
} from "@/lib/cart-requirements";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2 } from "lucide-react";
import { ConsentSignBlock } from "@/components/ConsentSignBlock";

type SignedHistoryRow = {
  id: string;
  signed_at: string;
  template_version: number;
  template: { slug: string; title: string } | null;
};

type ConsentSearch = { redirect?: string; products?: string };

export const Route = createFileRoute("/account_/consents")({
  head: () => ({ meta: [{ title: "Consents — Wellness Med Club" }] }),
  validateSearch: (s: Record<string, unknown>): ConsentSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    products: typeof s.products === "string" ? s.products : undefined,
  }),
  component: ConsentsPage,
});

function ConsentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const { redirect, products } = useSearch({ from: "/account_/consents" });

  const productIds = useMemo(
    () => (products ? products.split(",").map((p: string) => p.trim()).filter(Boolean) : []),
    [products],
  );
  const drivenByProducts = productIds.length > 0;
  const drivenByCart = !drivenByProducts && items.length > 0;

  const [templates, setTemplates] = useState<ConsentRequirement[]>([]);
  const [signedSlugs, setSignedSlugs] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<SignedHistoryRow[]>([]);
  const [templateIdBySlug, setTemplateIdBySlug] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);

      let requirements: ConsentRequirement[];
      if (drivenByProducts) {
        requirements = await fetchRequiredConsentsForProductIds(productIds);
      } else if (drivenByCart) {
        requirements = await fetchRequiredConsentsForCart(items);
      } else {
        // Portal mode: show only always_required consents to sign now.
        const { data } = await supabase
          .from("consent_templates")
          .select("slug, title, body, version, scope")
          .eq("active", true)
          .eq("scope", "always_required");
        requirements = (data ?? []).map((r) => ({
          slug: r.slug,
          title: r.title,
          body: r.body,
          version: r.version,
          scope: "always_required" as const,
        }));
      }
      setTemplates(requirements);

      // Resolve template ids for the slugs we need (for the insert FK)
      const slugs = requirements.map((r) => r.slug);
      if (slugs.length > 0) {
        const { data: idRows } = await supabase
          .from("consent_templates")
          .select("id, slug")
          .in("slug", slugs);
        const map: Record<string, string> = {};
        for (const r of idRows ?? []) map[r.slug] = r.id;
        setTemplateIdBySlug(map);

        const { data: sigs } = await supabase
          .from("consent_signatures")
          .select("consent_template_id, template_version")
          .eq("user_id", user.id)
          .in(
            "consent_template_id",
            (idRows ?? []).map((r) => r.id),
          );
        const signed = new Set<string>();
        for (const s of sigs ?? []) {
          const req = requirements.find(
            (r) => map[r.slug] === s.consent_template_id && r.version === s.template_version,
          );
          if (req) signed.add(req.slug);
        }
        setSignedSlugs(signed);
      } else {
        setSignedSlugs(new Set());
        setTemplateIdBySlug({});
      }

      // History for portal view
      const { data: hist } = await supabase
        .from("consent_signatures")
        .select("id, signed_at, template_version, consent_templates!inner(slug, title)")
        .eq("user_id", user.id)
        .order("signed_at", { ascending: false });
      setHistory(
        (hist ?? []).map((r) => ({
          id: r.id,
          signed_at: r.signed_at as string,
          template_version: r.template_version as number,
          template: (r.consent_templates as unknown as SignedHistoryRow["template"]) ?? null,
        })),
      );
      setLoading(false);
    })();
  }, [user, drivenByCart, drivenByProducts, productIds.join(","), items.map((i) => i.productId).sort().join(",")]);

  const allSigned = templates.length > 0 && templates.every((t) => signedSlugs.has(t.slug));


  if (authLoading || loading) {
    return (
      <SiteLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="informed consent"
        title={drivenByCart || drivenByProducts ? "Review and sign" : "Your consents"}
        subtitle={
          drivenByProducts
            ? "Sign the consents required for this treatment and lab panel, then return to payment."
            : drivenByCart
              ? "Sign the consents required for the items in your cart before checkout."
              : "The Waiver of Liability and Practice Policies apply to every patient. Medication-specific consents (GLP-1, TRT, HRT, controlled substances, non-FDA products) are presented at checkout only when you order those items."
        }
      />

      <section className="mx-auto max-w-3xl px-6 pb-20 space-y-6">
        {templates.length === 0 ? (
          <div className="border border-border p-8 text-center text-sm text-muted-foreground">
            No consents to sign right now.
          </div>
        ) : (
          user && (
            <ConsentSignBlock
              userId={user.id}
              consents={templates
                .filter((t) => templateIdBySlug[t.slug])
                .map((t) => ({
                  id: templateIdBySlug[t.slug],
                  slug: t.slug,
                  title: t.title,
                  body: t.body,
                  version: t.version,
                  scope: t.scope,
                  signed: signedSlugs.has(t.slug),
                }))}
              onSigned={(slugs) =>
                setSignedSlugs((s) => new Set([...s, ...slugs]))
              }
            />
          )
        )}


        {drivenByProducts && allSigned && redirect && (
          <div className="flex items-center justify-end pt-4">
            <button
              type="button"
              onClick={() => navigate({ to: redirect })}
              className="inline-flex items-center bg-ink text-primary-foreground px-6 py-3 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors"
            >
              Continue to payment
            </button>
          </div>
        )}

        {drivenByCart && (
          <div className="flex items-center justify-between pt-4">
            <Link to="/cart" className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Back to cart
            </Link>
            {allSigned && (
              <button
                type="button"
                onClick={() => navigate({ to: redirect ?? "/checkout" })}
                className="inline-flex items-center bg-ink text-primary-foreground px-6 py-3 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        )}

        {!drivenByCart && !drivenByProducts && history.length > 0 && (
          <div className="pt-8">
            <h2 className="font-serif text-2xl mb-4">Signed consents</h2>
            <ul className="border border-border divide-y divide-border">
              {history.map((row) => (
                <li key={row.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm">{row.template?.title ?? "Consent"}</div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                      v{row.template_version} · signed{" "}
                      {new Date(row.signed_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-accent">
                    <CheckCircle2 className="h-4 w-4" /> On file
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
