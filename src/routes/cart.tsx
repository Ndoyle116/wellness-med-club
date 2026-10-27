import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { useCart, formatPrice } from "@/lib/cart-context";
import { Trash2, ShoppingBag, FlaskConical, Plus, Check } from "lucide-react";
import { getSuggestedLabPanels, isLabPanelSlug, type SuggestedLab } from "@/lib/suggested-labs";
import { listMyApprovedManualLabProductIds } from "@/lib/approvals.functions";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Wellness Med Club" }] }),
  component: CartPage,
});

function CartPage() {
  const { user } = useAuth();
  const { items, remove, setQuantity, setAddOns, subtotalCents, add } = useCart();
  const requiresIntake = items.some((i) => i.requiresConsultation || i.requiresLabs || i.isControlled);
  const listApprovedManualLabs = useServerFn(listMyApprovedManualLabProductIds);

  const [suggestedLabs, setSuggestedLabs] = useState<SuggestedLab[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const approved = user
        ? await listApprovedManualLabs()
        : { productIds: [] as string[] };
      const results = await getSuggestedLabPanels(items, new Set(approved.productIds));
      if (!cancelled) setSuggestedLabs(results);
    })().catch(() => {
      if (!cancelled) getSuggestedLabPanels(items).then(setSuggestedLabs);
    });
    return () => {
      cancelled = true;
    };
  }, [items.map((i) => i.slug).sort().join(","), user?.id]);

  const inCartSlugs = new Set(items.map((i) => i.slug));
  const labsSubtotalCents = items
    .filter((i) => isLabPanelSlug(i.slug))
    .reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const productsSubtotalCents = subtotalCents - labsSubtotalCents;

  const addLabToCart = (lab: SuggestedLab) => {
    add(
      {
        productId: lab.id,
        slug: lab.slug,
        name: lab.name,
        category: "lab_panel",
        priceCents: lab.priceCents,
        requiresConsultation: false,
        requiresLabs: false,
        isControlled: false,
      },
      1,
    );
  };

  if (items.length === 0) {
    return (
      <SiteLayout>
        <PageHero eyebrow="cart" title="Your cart is empty" />
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Browse our catalog to get started.</p>
          <Link to="/products" className="mt-6 inline-flex items-center bg-ink text-primary-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] hover:bg-accent transition-colors">
            Shop products
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero eyebrow="cart" title="Review your order" subtitle="Some items require intake forms, recent labs, and provider review before fulfillment." />

      <section className="mx-auto max-w-5xl px-6 py-12 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((i) => {
            const addOnCents =
              (i.addSupplies ? i.suppliesPriceCents ?? 0 : 0) +
              (i.addBacWater ? i.bacWaterPriceCents ?? 0 : 0) +
              (i.addTelevisit ? i.televisitPriceCents ?? 0 : 0);
            const lineCents = (i.priceCents + addOnCents) * i.quantity;
            return (
              <div key={i.productId} className="border border-border p-4">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Link to="/products/$slug" params={{ slug: i.slug }} className="font-serif text-lg hover:text-accent">
                      {i.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {i.requiresConsultation && <span className="text-[10px] uppercase tracking-wider bg-secondary px-2 py-0.5">Consult</span>}
                      {i.requiresLabs && <span className="text-[10px] uppercase tracking-wider bg-secondary px-2 py-0.5">Labs</span>}
                      {i.isControlled && <span className="text-[10px] uppercase tracking-wider bg-accent/10 text-accent px-2 py-0.5">Rx</span>}
                    </div>
                  </div>
                  <button onClick={() => remove(i.productId)} aria-label="Remove" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {(i.suppliesAvailable || i.televisitAvailable || i.bacWaterAvailable) && (
                  <div className="mt-3 pt-3 border-t border-border grid sm:grid-cols-2 gap-2">
                    {i.suppliesAvailable && (
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!i.addSupplies}
                          onChange={(e) => setAddOns(i.productId, { addSupplies: e.target.checked })}
                        />
                        <span>
                          Add supplies kit (+{formatPrice(i.suppliesPriceCents ?? 0)})
                        </span>
                      </label>
                    )}
                    {i.bacWaterAvailable && (
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!i.addBacWater}
                          onChange={(e) => setAddOns(i.productId, { addBacWater: e.target.checked })}
                        />
                        <span>
                          Add bacteriostatic water, 30 mL (+{formatPrice(i.bacWaterPriceCents ?? 0)})
                        </span>
                      </label>
                    )}
                    {i.televisitAvailable && (
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!i.addTelevisit}
                          onChange={(e) => setAddOns(i.productId, { addTelevisit: e.target.checked })}
                        />
                        <span>
                          Optional Telehealth Visit (+{formatPrice(i.televisitPriceCents ?? 0)})
                        </span>
                      </label>
                    )}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-border flex gap-4 items-center">
                  <div className="flex items-center border border-border">
                    <button onClick={() => setQuantity(i.productId, i.quantity - 1)} className="px-2 py-1 hover:bg-secondary">−</button>
                    <span className="px-3 min-w-[2rem] text-center text-sm">{i.quantity}</span>
                    <button onClick={() => setQuantity(i.productId, i.quantity + 1)} className="px-2 py-1 hover:bg-secondary">+</button>
                  </div>
                  <div className="font-serif text-lg ml-auto text-right">{formatPrice(lineCents)}</div>
                </div>
                {i.purchaseAckText && (
                  <label className="mt-3 pt-3 border-t border-border flex items-start gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={!!i.acknowledged}
                      onChange={(e) => setAddOns(i.productId, { acknowledged: e.target.checked })}
                    />
                    <span className="text-muted-foreground">{i.purchaseAckText}</span>
                  </label>
                )}
              </div>
            );
          })}
        </div>

        <aside className="border border-border p-6 h-fit space-y-4">
          <div>
            <h2 className="font-serif text-2xl">Summary</h2>
            {labsSubtotalCents > 0 && (
              <>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-muted-foreground">Products</span>
                  <span>{formatPrice(productsSubtotalCents)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Labs</span>
                  <span>{formatPrice(labsSubtotalCents)}</span>
                </div>
                <div className="mt-2 h-px bg-border" />
              </>
            )}
            <div className="mt-3 flex justify-between font-serif text-lg">
              <span>Subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Final total calculated at checkout. Lab and consultation requirements determined by your cart.
            </div>
          </div>

          {suggestedLabs.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-accent" />
                <h3 className="text-xs uppercase tracking-[0.22em] font-semibold">Required labs</h3>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Recent labs (within 6 months) are required before your order ships. Add a panel below or upload existing results later.
              </p>
              <ul className="mt-3 space-y-2">
                {suggestedLabs.map((lab) => {
                  const added = inCartSlugs.has(lab.slug);
                  return (
                    <li key={lab.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="truncate">{lab.name}</div>
                        <div className="text-[11px] text-muted-foreground">{formatPrice(lab.priceCents)}</div>
                      </div>
                      {added ? (
                        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-accent">
                          <Check className="h-3 w-3" /> Added
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addLabToCart(lab)}
                          className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[11px] uppercase tracking-wider hover:bg-secondary"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {requiresIntake && (
            <div className="border border-accent/30 bg-accent/5 p-3 text-xs">
              Your cart includes items that require an intake form, consents, and provider review.
            </div>
          )}

          {items.some((i) => i.purchaseAckText && !i.acknowledged) && (
            <div className="border border-destructive/40 bg-destructive/5 p-3 text-xs">
              Please confirm the required acknowledgment on each item above before continuing.
            </div>
          )}

          <div>
            {items.some((i) => i.purchaseAckText && !i.acknowledged) ? (
              <span className="w-full inline-flex items-center justify-center bg-muted text-muted-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] cursor-not-allowed">
                Proceed to checkout
              </span>
            ) : (
              <Link
                to="/checkout"
                className="w-full inline-flex items-center justify-center bg-ink text-primary-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] hover:bg-accent transition-colors"
              >
                Proceed to checkout
              </Link>
            )}
            <Link to="/products" className="mt-3 block text-center text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent">
              Continue shopping
            </Link>
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}

