import { Injectable, signal } from '@angular/core';
import { email, form, required, validate } from '@angular/forms/signals';
import { passwordErrors } from './password-errors';

@Injectable({ providedIn: 'root' })
export class RegisterFormService {
  readonly model = signal({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  readonly form = form(this.model, (path) => {
    for (const field of [path.firstName, path.lastName]) {
      required(field, { message: 'validation.required' });
      validate(field, ({ value }) => {
        const name = value();
        if (!name) return undefined;
        if (name.trim().length < 2)
          return { kind: 'minlength', message: 'validation.minlength' };
        if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(name))
          return { kind: 'invalidChars', message: 'validation.invalidChars' };
        return undefined;
      });
    }
    required(path.email, { message: 'validation.required' });
    email(path.email, { message: 'validation.email' });
    required(path.phone, { message: 'validation.required' });
    validate(path.phone, ({ value }) =>
      value() && !/^09\d{9}$/.test(value())
        ? { kind: 'invalidPhone', message: 'validation.invalidPhone' }
        : undefined,
    );
    required(path.password, { message: 'validation.required' });
    validate(path.password, ({ value }) => passwordErrors(value()));
    required(path.confirmPassword, { message: 'validation.required' });
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() && valueOf(path.password) && value() !== valueOf(path.password)
        ? { kind: 'passwordsMismatch', message: 'validation.passwordsMismatch' }
        : undefined,
    );
  });

  resetForm() {
    this.form().reset();
  }
}
