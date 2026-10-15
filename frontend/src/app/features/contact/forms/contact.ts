import { Injectable, signal } from '@angular/core';
import { form, minLength, required, validate } from '@angular/forms/signals';
import type { ContactPayloadModel } from '@domain/models/contact';

@Injectable({ providedIn: 'root' })
export class ContactFormService {
  readonly model = signal({
    name: '',
    phone: '',
    message: '',
  });
  readonly form = form(this.model, (path) => {
    required(path.name, { message: 'validation.required' });
    required(path.phone, { message: 'validation.required' });
    validate(path.phone, ({ value }) =>
      value() && !/^09\d{9}$/.test(value())
        ? { kind: 'invalidPhone', message: 'validation.invalidPhone' }
        : undefined,
    );
    required(path.message, { message: 'validation.required' });
    minLength(path.message, 10, { message: 'validation.minlength' });
  });

  resetForm() {
    this.form().reset();
  }

  get payload(): ContactPayloadModel {
    const value = this.model();
    return {
      name: value.name.trim(),
      phone: value.phone.trim(),
      message: value.message.trim(),
    };
  }
}
