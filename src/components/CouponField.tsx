import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Tag, X } from "lucide-react";
import { previewCoupon } from "@/lib/admin-coupons.functions";

export type AppliedCoupon = { code: string; discountCents: number };

const ERROR_COPY: Record<string, string> = {
  invalid: "That promo code is not valid.",
  expired: "That promo code has expired.",
  not_started: "That promo code is not active yet.",
  max_uses: "That promo code has reached its usage limit.",
  no_eligible_items:
    "None of the items in your cart qualify for this code. Testosterone and phentermine don't qualify.",
};

export function CouponField({
  items,
  applied,
  onApply,
}: {
  items: Array<{ productId: string; quantity: number }>;
  applied: AppliedCoupon | null;
  onApply: (c: AppliedCoupon | null) => void;
}) {
  const check = useServerFn(previewCoupon);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await check({ data: { code: code.trim(), items } });
      if (!res.valid) {
        const reason = res.error ?? "invalid";
        setError(
          reason.startsWith("min_order:")
            ? `This code requires a minimum order of $${(Number(reason.split(":")[1] ?? 0) / 100).toFixed(2)}.`
            : reason.startsWith("min_items:")
              ? `This code needs at least ${reason.split(":")[1]} qualifying items in your cart. Testosterone and phentermine don't count.`
              : ERROR_COPY[reason] ?? "That promo code is not valid.",
        );
        onApply(null);
        return;
      }
      onApply({ code: res.code, discountCents: res.discountCents });
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to check that code.");
    } finally {
      setBusy(false);
    }
  };

  if (applied) {
    return (
      <div className="mt-4 flex items-center justify-between border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-accent" />
          <span className="font-mono">{applied.code}</span> applied
        </span>
        <button
          type="button"
          onClick={() => onApply(null)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Remove promo code"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void apply();
            }
          }}
          placeholder="Promo code"
          className="flex-1 border border-border bg-background px-3 py-2 text-sm font-mono uppercase"
        />
        <button
          type="button"
          onClick={apply}
          disabled={busy || !code.trim()}
          className="border border-border px-4 py-2 text-xs uppercase tracking-[0.22em] hover:bg-secondary disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
