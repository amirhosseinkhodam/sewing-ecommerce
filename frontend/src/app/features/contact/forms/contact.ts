import { Injectable, signal } from '@angular/core';
import {
  email,
  form,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import type { ContactPayloadModel } from '@domain/models/contact';

@Injectable({ providedIn: 'root' })
export class ContactFormService {
  readonly model = signal({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  readonly form = form(this.model, (path) => {
    required(path.name, { message: 'validation.required' });
    required(path.email, { message: 'validation.required' });
    email(path.email, { message: 'validation.email' });
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
      email: value.email.trim(),
      phone: value.phone.trim() || undefined,
      message: value.message.trim(),
    };
  }
}
