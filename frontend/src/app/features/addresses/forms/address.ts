import { Injectable, signal } from '@angular/core';
import { form, required, validate } from '@angular/forms/signals';
import type { AddressModel } from '@domain/models/address';

@Injectable({ providedIn: 'root' })
export class AddressFormService {
  readonly model = signal({
    label: '',
    province: '',
    city: '',
    fullAddress: '',
    postalCode: '',
    phone: '',
    isDefault: false,
  });
  readonly form = form(this.model, (path) => {
    for (const field of [
      path.label,
      path.province,
      path.city,
      path.fullAddress,
      path.phone,
    ]) {
      required(field, { message: 'validation.required' });
    }
    validate(path.phone, ({ value }) =>
      value() && !/^09\d{9}$/.test(value())
        ? { kind: 'invalidPhone', message: 'validation.invalidPhone' }
        : undefined,
    );
  });

  patchFromAddress(address: Partial<AddressModel>) {
    this.model.set({
      label: address.label ?? '',
      province: address.province ?? '',
      city: address.city ?? '',
      fullAddress: address.fullAddress ?? '',
      postalCode: address.postalCode ?? '',
      phone: address.phone ?? '',
      isDefault: address.isDefault ?? false,
    });
  }

  resetForm() {
    this.form().reset();
  }
}
