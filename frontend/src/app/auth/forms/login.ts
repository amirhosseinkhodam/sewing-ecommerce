import { Injectable, signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import { phoneRule } from '@shared/forms/rules';

@Injectable({ providedIn: 'root' })
export class LoginFormService {
  readonly model = signal({ phone: '', password: '' });
  // Login only checks presence: password strength is a registration concern, and
  // enforcing it here locks out accounts whose password predates a policy change.
  readonly form = form(this.model, (path) => {
    phoneRule(path.phone);
    required(path.password, { message: 'validation.required' });
  });

  resetForm() {
    this.form().reset();
  }
}
