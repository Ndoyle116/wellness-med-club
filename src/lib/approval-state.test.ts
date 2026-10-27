import { describe, expect, it } from "vitest";
import { getUsableManualApprovalProductIds, isApprovalStillValid, type ApprovalSummary } from "./approval-state";

const approval = (
  product_id: string,
  status: ApprovalSummary["status"],
  requested_via: ApprovalSummary["requested_via"],
): ApprovalSummary => ({ product_id, status, requested_via });

describe("usable manual lab approvals", () => {
  it("returns only approved manual-lab product IDs", () => {
    expect(
      getUsableManualApprovalProductIds([
        approval("manual", "approved", "uploaded_labs"),
        approval("pending", "pending", "uploaded_labs"),
        approval("denied", "disapproved", "uploaded_labs"),
        approval("purchased", "approved", "purchased_labs"),
        approval("consumed", "consumed", "uploaded_labs"),
      ]),
    ).toEqual(["manual"]);
  });

  it("uses the latest approval when a prior approval was consumed", () => {
    expect(
      getUsableManualApprovalProductIds([
        approval("manual", "consumed", "uploaded_labs"),
        approval("manual", "approved", "uploaded_labs"),
      ]),
    ).toEqual([]);
  });

  it("deduplicates repeated approvals for the same product", () => {
    expect(
      getUsableManualApprovalProductIds([
        approval("manual", "approved", "uploaded_labs"),
        approval("manual", "approved", "uploaded_labs"),
      ]),
    ).toEqual(["manual"]);
  });
});

describe("isApprovalStillValid", () => {
  const old = new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString();
  const recent = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();

  it("expires uploaded outside labs after 6 months", () => {
    expect(
      isApprovalStillValid({ status: "approved", requested_via: "uploaded_labs", reviewed_at: old }),
    ).toBe(false);
    expect(
      isApprovalStillValid({ status: "approved", requested_via: "uploaded_labs", reviewed_at: recent }),
    ).toBe(true);
  });

  it("never expires panels we ordered", () => {
    expect(
      isApprovalStillValid({ status: "consumed", requested_via: "purchased_labs", reviewed_at: old }),
    ).toBe(true);
  });

  it("treats a consumed upload as spent, even minutes later", () => {
    expect(
      isApprovalStillValid({
        status: "consumed",
        requested_via: "uploaded_labs",
        reviewed_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      }),
    ).toBe(false);
    expect(
      isApprovalStillValid({ status: "consumed", requested_via: "uploaded_labs", reviewed_at: recent }),
    ).toBe(false);
  });
});
