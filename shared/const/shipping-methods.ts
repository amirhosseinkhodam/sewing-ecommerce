export const SHIPPING_METHODS = {
  POST: 'POST',
  COURIER: 'COURIER',
} as const;

export type ShippingMethod =
  (typeof SHIPPING_METHODS)[keyof typeof SHIPPING_METHODS];
