/** Flat fee charged when a patient submits outside lab work for clinician review. */
export const MANUAL_LAB_REVIEW_FEE_CENTS = 2000;

export const formatFee = (cents: number) => `$${(cents / 100).toFixed(2)}`;
