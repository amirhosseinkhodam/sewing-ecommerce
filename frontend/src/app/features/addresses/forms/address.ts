import { Injectable, signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import type { AddressModel } from '@domain/models/address';
import { phoneRule } from '@shared/forms/rules';

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
    ]) {
      required(field, { message: 'validation.required' });
    }
    phoneRule(path.phone);
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
