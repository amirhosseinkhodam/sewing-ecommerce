import { Injectable, signal } from '@angular/core';
import { email, form, required, validate } from '@angular/forms/signals';
import { passwordErrors } from './password-errors';

@Injectable({ providedIn: 'root' })
export class LoginFormService {
  readonly model = signal({ email: '', password: '' });
  readonly form = form(this.model, (path) => {
    required(path.email, { message: 'validation.required' });
    email(path.email, { message: 'validation.email' });
    required(path.password, { message: 'validation.required' });
    validate(path.password, ({ value }) => passwordErrors(value()));
  });

  resetForm() {
    this.form().reset();
  }
}
