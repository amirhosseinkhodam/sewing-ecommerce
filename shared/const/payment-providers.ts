/**
 * Which gateway handles `ONLINE` payments, chosen by the backend's
 * `PAYMENT_PROVIDER` env var. `FAKE` is a local stand-in for development and
 * demos; `ZARINPAL` talks to Zarinpal (sandbox or production).
 */
export const PAYMENT_PROVIDERS = {
  FAKE: 'FAKE',
  ZARINPAL: 'ZARINPAL',
} as const;

export type PaymentProvider =
  (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];
