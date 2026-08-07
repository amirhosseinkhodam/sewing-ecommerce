import { inject, Injectable } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import {
  strongPasswordValidator,
  passwordMatchValidator,
} from "../validators";

@Injectable({ providedIn: "root" })
export class PasswordFormService {
  readonly #fb = inject(FormBuilder);
  readonly #form = this.#fb.nonNullable.group(
    {
      currentPassword: [""],
      newPassword: ["", [Validators.required, strongPasswordValidator()]],
      confirmPassword: ["", [Validators.required]],
    },
    { validators: passwordMatchValidator("newPassword", "confirmPassword") },
  );

  resetForm() {
    this.#form.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }

  get form() {
    return this.#form;
  }
}
