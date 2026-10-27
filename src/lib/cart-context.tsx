import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Database } from "@/integrations/supabase/types";

type ProductCategory = Database["public"]["Enums"]["product_category"];

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  category: ProductCategory;
  priceCents: number;
  quantity: number;
  requiresConsultation: boolean;
  requiresLabs: boolean;
  isControlled: boolean;
  requiresAppointment?: boolean;
  // Add-ons
  suppliesAvailable?: boolean;
  suppliesPriceCents?: number;
  addSupplies?: boolean;
  televisitAvailable?: boolean;
  televisitPriceCents?: number;
  addTelevisit?: boolean;
  bacWaterAvailable?: boolean;
  bacWaterPriceCents?: number;
  addBacWater?: boolean;
  purchaseAckText?: string | null;
  acknowledged?: boolean;
};


type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  setAddOns: (
    productId: string,
    addOns: { addSupplies?: boolean; addTelevisit?: boolean; addBacWater?: boolean; acknowledged?: boolean },
  ) => void;
  clear: () => void;
  subtotalCents: number;
  count: number;
};

const CartContext = createContext<CartState | undefined>(undefined);
const STORAGE_KEY = "wmc_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
        const parsed: CartItem[] = raw ? JSON.parse(raw) : [];
        if (parsed.length > 0) {
          const { supabase } = await import("@/integrations/supabase/client");
          const ids = parsed.map((i) => i.productId);
          const { data } = await supabase.from("products").select("id").in("id", ids).eq("active", true);
          const validIds = new Set((data ?? []).map((p) => p.id));
          setItems(parsed.filter((i) => validIds.has(i.productId)));
        }
      } catch {
        // ignore
      }
      setHydrated(true);
    })();
  }, []);


  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const add: CartState["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? {
                ...i,
                quantity: i.quantity + qty,
                // Overwrite add-on selection with the latest choice
                addSupplies: item.addSupplies ?? i.addSupplies,
                addTelevisit: item.addTelevisit ?? i.addTelevisit,
                addBacWater: item.addBacWater ?? i.addBacWater,
                acknowledged: item.acknowledged ?? i.acknowledged,
              }
            : i,
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const remove: CartState["remove"] = (productId) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const setQuantity: CartState["setQuantity"] = (productId, qty) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)),
    );

  const setAddOns: CartState["setAddOns"] = (productId, addOns) =>
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? {
              ...i,
              ...(addOns.addSupplies !== undefined && { addSupplies: addOns.addSupplies }),
              ...(addOns.addTelevisit !== undefined && { addTelevisit: addOns.addTelevisit }),
              ...(addOns.addBacWater !== undefined && { addBacWater: addOns.addBacWater }),
              ...(addOns.acknowledged !== undefined && { acknowledged: addOns.acknowledged }),
            }
          : i,
      ),
    );

  const clear = () => setItems([]);

  const subtotalCents = items.reduce((sum, i) => {
    const addOns =
      (i.addSupplies ? i.suppliesPriceCents ?? 0 : 0) +
      (i.addTelevisit ? i.televisitPriceCents ?? 0 : 0) +
      (i.addBacWater ? i.bacWaterPriceCents ?? 0 : 0);
    return sum + (i.priceCents + addOns) * i.quantity;
  }, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, add, remove, setQuantity, setAddOns, clear, subtotalCents, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
