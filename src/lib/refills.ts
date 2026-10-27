/**
 * Refills — shared (browser-safe) helpers.
 *
 * Refills exist only for medications that require a pre-purchase visit
 * (testosterone, phentermine). A refill is never auto-approved: the patient's
 * card is AUTHORISED when they request it and only captured if the provider
 * approves. Declines release the authorisation.
 */

export type RefillStatus = "pending" | "approved" | "declined" | "cancelled";

export type RefillEligibility = {
  /** Product allows refills at all (refills_allowed > 0). */
  supported: boolean;
  /** Patient has an initial paid order + completed visit + approved labs. */
  qualified: boolean;
  allowed: number;
  used: number;
  remaining: number;
  pending: boolean;
  amountCents: number;
  productName: string;
  refillNote: string | null;
  /** Human explanation when `qualified` is false. */
  blockedReason: string | null;
};

export const REFILL_PENDING_COPY =
  "Pending Provider Review and Approval — your card is authorised now and only charged if your provider approves.";

export const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;
