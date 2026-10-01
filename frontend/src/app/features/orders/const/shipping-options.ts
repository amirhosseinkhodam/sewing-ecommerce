import {
  SHIPPING_METHODS,
  type ShippingMethod,
} from '@domain/const/shipping-methods';
import type { ShopSettingsModel } from '@domain/models/settings';

export interface ShippingOptionModel {
  readonly method: ShippingMethod;
  readonly labelKey: string;
  readonly price: number;
  readonly etaDays: number;
}

/** Translation key per method; the rates themselves come from settings. */
const SHIPPING_LABEL_KEYS: Readonly<Record<ShippingMethod, string>> = {
  [SHIPPING_METHODS.POST]: 'post',
  [SHIPPING_METHODS.COURIER]: 'courier',
};

/**
 * Builds the checkout shipping choices from the admin-editable rates. The
 * prices shown here are the same ones the server charges — it resolves the
 * rate from this row too — so the two can never drift.
 */
export function shippingOptions(
  settings: ShopSettingsModel,
): ShippingOptionModel[] {
  return Object.values(SHIPPING_METHODS).map((method) => ({
    method,
    labelKey: SHIPPING_LABEL_KEYS[method],
    price: Number(settings.shippingRates[method].price),
    etaDays: settings.shippingRates[method].etaDays,
  }));
}
