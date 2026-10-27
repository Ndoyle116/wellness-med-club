export type ApprovalSummary = {
  product_id: string;
  status: "pending" | "approved" | "disapproved" | "consumed";
  requested_via: "uploaded_labs" | "purchased_labs";
  reviewed_at?: string | null;
  created_at?: string | null;
};

export function getUsableManualApprovalProductIds(
  approvals: ApprovalSummary[],
): string[] {
  const latestByProduct = new Map<string, ApprovalSummary>();
  for (const approval of approvals) {
    if (!latestByProduct.has(approval.product_id)) {
      latestByProduct.set(approval.product_id, approval);
    }
  }
  return Array.from(latestByProduct.values())
    .filter(
      (approval) =>
        isApprovalStillValid(approval) && approval.requested_via === "uploaded_labs",
    )
    .map((approval) => approval.product_id);
}

/**
 * Every approval that still clears the lab gate — uploaded outside reports AND
 * panels the patient purchased through us. Used to stop checkout from asking
 * for a lab panel the provider has already approved.
 */
export function getUsableApprovalProductIds(approvals: ApprovalSummary[]): string[] {
  const latestByProduct = new Map<string, ApprovalSummary>();
  for (const approval of approvals) {
    if (!latestByProduct.has(approval.product_id)) {
      latestByProduct.set(approval.product_id, approval);
    }
  }
  return Array.from(latestByProduct.values())
    .filter((approval) => isApprovalStillValid(approval))
    .map((approval) => approval.product_id);
}

/** Outside lab reports (and the approval based on them) stay valid 6 months. */
export const LAB_VALIDITY_MS = 1000 * 60 * 60 * 24 * 183;

/**
 * Two different validity paths:
 *
 * - `uploaded_labs` — the patient brought an outside report. The 6-month
 *   recency rule strictly applies; once the approval ages past the window the
 *   patient must submit newer labs or buy our panel.
 * - `purchased_labs` — we ordered the panel ourselves, so freshness is
 *   guaranteed and no expiry window applies.
 *
 * A "consumed" uploaded-lab approval is spent: each new order re-runs the
 * upload/review check from scratch, no matter how recently it was reviewed.
 * Consumed purchased-panel approvals still clear the gate.
 */
export function isApprovalStillValid(
  approval: {
    status: string;
    requested_via?: "uploaded_labs" | "purchased_labs" | null;
    reviewed_at?: string | null;
    created_at?: string | null;
  },
  now: number = Date.now(),
): boolean {
  if (approval.status !== "approved" && approval.status !== "consumed") return false;
  // Panels we ordered never expire out of the gate, even once consumed.
  if (approval.requested_via === "purchased_labs") return true;
  // Outside reports are single-use: once an order consumes one, the next order
  // must go through upload + review again.
  if (approval.status === "consumed") return false;
  const ts = approval.reviewed_at ?? approval.created_at;
  if (!ts) return approval.status === "approved";
  return now - new Date(ts).getTime() <= LAB_VALIDITY_MS;
}
