import { inject, Injectable } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import {
  persianNameValidator,
  iranianPhoneValidator,
  strongPasswordValidator,
  passwordMatchValidator,
} from "../../../shared/validators";

@Injectable({ providedIn: "root" })
export class RegisterFormService {
  readonly #fb = inject(FormBuilder);
  readonly #form = this.#fb.nonNullable.group(
    {
      firstName: ["", [Validators.required, persianNameValidator()]],
      lastName: ["", [Validators.required, persianNameValidator()]],
      email: ["", [Validators.required, Validators.email]],
      phone: ["", [Validators.required, iranianPhoneValidator()]],
      password: ["", [Validators.required, strongPasswordValidator()]],
      confirmPassword: ["", Validators.required],
    },
    { validators: passwordMatchValidator("password", "confirmPassword") },
  );

  resetForm() {
    this.#form.reset();
  }

  get form() {
    return this.#form;
  }
}
