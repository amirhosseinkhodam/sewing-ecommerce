import { inject, Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { strongPasswordValidator } from '@shared/validators/validators';

@Injectable({ providedIn: 'root' })
export class LoginFormService {
  readonly #fb = inject(FormBuilder);
  readonly #form = this.#fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, strongPasswordValidator()]],
  });

  resetForm() {
    this.#form.reset();
  }

  get form() {
    return this.#form;
  }
}
