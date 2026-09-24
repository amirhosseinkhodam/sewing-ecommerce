import { inject, Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { iranianPhoneValidator } from '@shared/validators/validators';
import type { ContactPayloadModel } from '@domain/models/contact';

@Injectable({ providedIn: 'root' })
export class ContactFormService {
  readonly #fb = inject(FormBuilder);

  readonly #form = this.#fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    // Optional, but must look like an Iranian number when provided.
    phone: ['', iranianPhoneValidator()],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  resetForm() {
    this.#form.reset();
  }

  get form() {
    return this.#form;
  }

  get payload(): ContactPayloadModel {
    const value = this.#form.getRawValue();
    return {
      name: value.name.trim(),
      email: value.email.trim(),
      phone: value.phone.trim() || undefined,
      message: value.message.trim(),
    };
  }
}
