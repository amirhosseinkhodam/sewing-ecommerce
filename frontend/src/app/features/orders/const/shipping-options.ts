import {
  SHIPPING_METHODS,
  type ShippingMethod,
} from '@domain/const/shipping-methods';

export interface ShippingOptionModel {
  readonly method: ShippingMethod;
  readonly labelKey: string;
  readonly price: number;
  readonly etaDays: number;
}

export const SHIPPING_OPTIONS: ShippingOptionModel[] = [
  {
    method: SHIPPING_METHODS.POST,
    labelKey: 'post',
    price: 60000,
    etaDays: 5,
  },
  {
    method: SHIPPING_METHODS.COURIER,
    labelKey: 'courier',
    price: 180000,
    etaDays: 2,
  },
];
