/**
 * `?payment=` value the backend appends when it sends the customer back to
 * `/orders/:id` after an online payment attempt, so the page can say how it went.
 */
export const PAYMENT_RESULTS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const;

export type PaymentResult =
  (typeof PAYMENT_RESULTS)[keyof typeof PAYMENT_RESULTS];
