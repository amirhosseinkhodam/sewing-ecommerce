import { inject, Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import type { AddressModel } from '@domain/models/address';
import { iranianPhoneValidator } from '@shared/validators/validators';

@Injectable({ providedIn: 'root' })
export class AddressFormService {
  readonly #fb = inject(FormBuilder);
  readonly #form = this.#fb.nonNullable.group({
    label: ['', Validators.required],
    province: ['', Validators.required],
    city: ['', Validators.required],
    fullAddress: ['', Validators.required],
    postalCode: [''],
    phone: ['', [Validators.required, iranianPhoneValidator()]],
    isDefault: [false],
  });

  patchFromAddress(address: Partial<AddressModel>) {
    this.#form.patchValue(address);
  }

  resetForm() {
    this.#form.reset();
  }

  get form() {
    return this.#form;
  }
}
