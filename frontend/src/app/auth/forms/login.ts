import { Injectable, signal } from '@angular/core';
import { form, required, validate } from '@angular/forms/signals';

@Injectable({ providedIn: 'root' })
export class LoginFormService {
  readonly model = signal({ phone: '', password: '' });
  // Login only checks presence: password strength is a registration concern, and
  // enforcing it here locks out accounts whose password predates a policy change.
  readonly form = form(this.model, (path) => {
    required(path.phone, { message: 'validation.required' });
    validate(path.phone, ({ value }) =>
      value() && !/^09\d{9}$/.test(value())
        ? { kind: 'invalidPhone', message: 'validation.invalidPhone' }
        : undefined,
    );
    required(path.password, { message: 'validation.required' });
  });

  resetForm() {
    this.form().reset();
  }
}
