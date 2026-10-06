/** `Status` values a gateway sends back on the callback (Zarinpal's names). */
export const CALLBACK_STATUSES = {
  OK: 'OK',
  NOK: 'NOK',
} as const;

export type CallbackStatus =
  (typeof CALLBACK_STATUSES)[keyof typeof CALLBACK_STATUSES];
