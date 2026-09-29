import { Injectable, signal } from '@angular/core';
import { email, form, required } from '@angular/forms/signals';

@Injectable({ providedIn: 'root' })
export class LoginFormService {
  readonly model = signal({ email: '', password: '' });
  // Login only checks presence: password strength is a registration concern, and
  // enforcing it here locks out accounts whose password predates a policy change.
  readonly form = form(this.model, (path) => {
    required(path.email, { message: 'validation.required' });
    email(path.email, { message: 'validation.email' });
    required(path.password, { message: 'validation.required' });
  });

  resetForm() {
    this.form().reset();
  }
}
