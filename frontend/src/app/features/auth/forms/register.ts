import { inject, Injectable } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

@Injectable({ providedIn: "root" })
export class RegisterFormService {
  readonly #fb = inject(FormBuilder);
  readonly #form = this.#fb.nonNullable.group({
    firstName: ["", Validators.required],
    lastName: ["", Validators.required],
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    confirmPassword: ["", Validators.required],
    phone: ["", Validators.required],
  });

  resetForm() {
    this.#form.reset();
  }

  get form() {
    return this.#form;
  }
}
