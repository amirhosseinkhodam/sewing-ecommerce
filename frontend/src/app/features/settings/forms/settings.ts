import { Injectable, signal } from '@angular/core';
import { email, form, required, validate } from '@angular/forms/signals';
import type {
  ShopSettingsModel,
  UpdateShopSettingsPayloadModel,
} from '@domain/models/settings';
import { SHIPPING_METHODS } from '@domain/const/shipping-methods';

/**
 * Shipping prices and ETAs are bound as strings by `app-input`, so they are
 * range-checked here rather than with the numeric `min` validator.
 */
const nonNegativeNumber = (value: string) =>
  value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0
    ? undefined
    : { kind: 'invalidAmount', message: 'validation.invalidAmount' };

/**
 * The form is flat, matching `UpdateShopSettingsPayloadModel` rather than the
 * nested `shippingRates` the read returns: one control per field keeps the
 * validation and the template in one-to-one correspondence with the DTO.
 *
 * Numbers are held as strings because that is what `app-input` binds; they are
 * converted once in `payload`.
 */
@Injectable({ providedIn: 'root' })
export class SettingsFormService {
  readonly model = signal({
    shopName: '',
    bankCardNumber: '',
    bankCardHolder: '',
    shopPhone: '',
    shopEmail: '',
    shopAddress: '',
    businessHours: '',
    postPrice: '0',
    postEtaDays: '0',
    courierPrice: '0',
    courierEtaDays: '0',
  });

  readonly form = form(this.model, (path) => {
    required(path.shopName, { message: 'validation.required' });
    required(path.bankCardNumber, { message: 'validation.required' });
    required(path.bankCardHolder, { message: 'validation.required' });
    required(path.shopPhone, { message: 'validation.required' });
    required(path.shopEmail, { message: 'validation.required' });
    email(path.shopEmail, { message: 'validation.email' });
    required(path.shopAddress, { message: 'validation.required' });
    required(path.businessHours, { message: 'validation.required' });
    for (const field of [
      path.postPrice,
      path.postEtaDays,
      path.courierPrice,
      path.courierEtaDays,
    ]) {
      required(field, { message: 'validation.required' });
      validate(field, ({ value }) => nonNegativeNumber(value()));
    }
  });

  /** Flattens the server's nested shipping rates back into form fields. */
  patchFromSettings(settings: ShopSettingsModel) {
    const post = settings.shippingRates[SHIPPING_METHODS.POST];
    const courier = settings.shippingRates[SHIPPING_METHODS.COURIER];
    this.model.set({
      shopName: settings.shopName,
      bankCardNumber: settings.bankCardNumber,
      bankCardHolder: settings.bankCardHolder,
      shopPhone: settings.shopPhone,
      shopEmail: settings.shopEmail,
      shopAddress: settings.shopAddress,
      businessHours: settings.businessHours,
      postPrice: post.price,
      postEtaDays: String(post.etaDays),
      courierPrice: courier.price,
      courierEtaDays: String(courier.etaDays),
    });
  }

  get payload(): UpdateShopSettingsPayloadModel {
    const value = this.model();
    return {
      shopName: value.shopName.trim(),
      bankCardNumber: value.bankCardNumber.trim(),
      bankCardHolder: value.bankCardHolder.trim(),
      shopPhone: value.shopPhone.trim(),
      shopEmail: value.shopEmail.trim(),
      shopAddress: value.shopAddress.trim(),
      businessHours: value.businessHours.trim(),
      postPrice: value.postPrice,
      postEtaDays: Number(value.postEtaDays),
      courierPrice: value.courierPrice,
      courierEtaDays: Number(value.courierEtaDays),
    };
  }
}
