export const PAYMENT_METHODS = {
  ZARINPAL: 'ZARINPAL',
  CARD_TO_CARD: 'CARD_TO_CARD',
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];
