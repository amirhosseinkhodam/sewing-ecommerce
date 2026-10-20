import { Injectable, signal } from '@angular/core';
import { form, required, validate } from '@angular/forms/signals';
import { phoneRule, personNameRule } from '@shared/forms/rules';
import { passwordErrors } from './password-errors';

@Injectable({ providedIn: 'root' })
export class RegisterFormService {
  readonly model = signal({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  readonly form = form(this.model, (path) => {
    personNameRule(path.firstName);
    personNameRule(path.lastName);
    phoneRule(path.phone);
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
