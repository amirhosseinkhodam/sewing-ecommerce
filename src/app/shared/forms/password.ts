import { inject, Injectable } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';

function matchPasswords(control: AbstractControl): ValidationErrors | null {
  const group = control as import('@angular/forms').FormGroup;
  const newPw = group.get('newPassword')?.value;
  const confirmPw = group.get('confirmPassword')?.value;
  return newPw === confirmPw ? null : { passwordsMismatch: true };
}

@Injectable({ providedIn: 'root' })
export class PasswordFormService {
  readonly #fb = inject(FormBuilder);
  readonly #form = this.#fb.nonNullable.group(
    {
      currentPassword: [''],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: matchPasswords },
  );

  resetForm() {
    this.#form.reset({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }

  get form() {
    return this.#form;
  }
}
