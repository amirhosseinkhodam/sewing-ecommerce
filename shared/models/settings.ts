import type { ShippingMethod } from '../const/shipping-methods';

export interface ShippingRateModel {
  /** Decimal crosses the API as a string; it is added to the items subtotal. */
  readonly price: string;
  readonly etaDays: number;
}

/**
 * The shop's editable details, read by the public Contact/About pages, the
 * checkout shipping step, and the card-to-card payment instructions. A single
 * row backs it, so there is nothing to page or filter.
 */
export interface ShopSettingsModel {
  readonly shopName: string;
  readonly bankCardNumber: string;
  readonly bankCardHolder: string;
  readonly shopPhone: string;
  readonly shopEmail: string;
  readonly shopAddress: string;
  readonly businessHours: string;
  /** Keyed by shipping method so the checkout can render the step generically. */
  readonly shippingRates: Readonly<Record<ShippingMethod, ShippingRateModel>>;
  readonly updatedAt: string;
}

/**
 * The write shape is flat rather than the nested `shippingRates` record: the
 * settings form binds one control per field, and a flat body keeps the DTO
 * validation and the Signal Form fields in one-to-one correspondence.
 */
export interface UpdateShopSettingsPayloadModel {
  readonly shopName: string;
  readonly bankCardNumber: string;
  readonly bankCardHolder: string;
  readonly shopPhone: string;
  readonly shopEmail: string;
  readonly shopAddress: string;
  readonly businessHours: string;
  readonly postPrice: string;
  readonly postEtaDays: number;
  readonly courierPrice: string;
  readonly courierEtaDays: number;
}
