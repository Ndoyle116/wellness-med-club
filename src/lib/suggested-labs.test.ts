import { describe, expect, it } from "vitest";
import { getSuggestedLabItems } from "./suggested-labs";
import type { CartItem } from "./cart-context";

const item = (productId: string): CartItem => ({
  productId,
  slug: "hrm-testosterone-cypionate-200mg-5ml-men",
  name: "Testosterone Cypionate",
  category: "hormone_trt",
  priceCents: 10000,
  quantity: 1,
  requiresConsultation: false,
  requiresLabs: true,
  isControlled: true,
});

describe("manual lab approval lab-panel suggestions", () => {
  it("does not suggest a paid panel for an approved manual-lab product", () => {
    expect(getSuggestedLabItems([item("product-1")], new Set(["product-1"]))).toEqual([]);
  });

  it("continues suggesting a panel when the product is not approved", () => {
    expect(getSuggestedLabItems([item("product-1")], new Set())).toHaveLength(1);
  });

  it("does not hide another treatment that still needs labs", () => {
    expect(
      getSuggestedLabItems([item("product-1"), item("product-2")], new Set(["product-1"])),
    ).toEqual([item("product-2")]);
  });
});
