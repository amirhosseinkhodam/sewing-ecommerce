import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { TranslatePipe } from "../../../shared/pipes/translate";
import { CardComponent } from "../../../shared/components/card";
import { ButtonComponent } from "../../../shared/components/button";
import { InputComponent } from "../../../shared/components/input";
import { FormComponent } from "../../../shared/components/form";
import { FormFieldComponent } from "../../../shared/components/form-field";
import { RegisterFormService } from "../forms/register";
import { AuthStore } from "../store/auth";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    FormComponent,
    FormFieldComponent,
    TranslatePipe,
  ],
  template: `
    <div class="min-h-screen-80 flex items-center justify-center px-4 py-8">
      <app-card variant="bordered" [cssClass]="'max-w-md w-full'">
        <div class="flex flex-col gap-6">
          <div class="text-center">
            <h1
              class="text-2xl font-bold text-slate-900 dark:text-slate-100"
            >
              {{ 'createAccount' | translate }}
            </h1>
          </div>

          @if (
            registerForm.form.errors?.["passwordsMismatch"] &&
            registerForm.form.get("confirmPassword")?.touched
          ) {
            <div
              class="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg"
            >
              {{ 'validation.passwordsMismatch' | translate }}
            </div>
          }

          <app-form
            [formGroup]="registerForm.form"
            (formSubmit)="onSubmit()"
            cssClass="flex flex-col gap-4"
          >
            <div class="grid grid-cols-2 gap-4">
              <div>
                <app-input
                  formControlName="firstName"
                  type="text"
                  [label]="'firstName' | translate"
                  [placeholder]="'firstName' | translate"
                />
                <app-form-field
                  [control]="registerForm.form.get('firstName')!"
                />
              </div>
              <div>
                <app-input
                  formControlName="lastName"
                  type="text"
                  [label]="'lastName' | translate"
                  [placeholder]="'lastName' | translate"
                />
                <app-form-field
                  [control]="registerForm.form.get('lastName')!"
                />
              </div>
            </div>

            <div>
              <app-input
                formControlName="email"
                type="email"
                [label]="'email' | translate"
                [placeholder]="'email' | translate"
                autocomplete="email"
              />
              <app-form-field
                [control]="registerForm.form.get('email')!"
              />
            </div>

            <div>
              <app-input
                formControlName="phone"
                type="text"
                [label]="'phone' | translate"
                [placeholder]="'phone' | translate"
                autocomplete="tel"
              />
              <app-form-field
                [control]="registerForm.form.get('phone')!"
              />
            </div>

            <div>
              <app-input
                formControlName="password"
                type="password"
                [label]="'password' | translate"
                [placeholder]="'password' | translate"
                autocomplete="new-password"
              />
              <app-form-field
                [control]="registerForm.form.get('password')!"
              />
            </div>

            <div>
              <app-input
                formControlName="confirmPassword"
                type="password"
                [label]="'confirmPassword' | translate"
                [placeholder]="'confirmPassword' | translate"
                autocomplete="new-password"
              />
              <app-form-field
                [control]="registerForm.form.get('confirmPassword')!"
              />
            </div>

            <app-button
              type="submit"
              variant="primary"
              [loading]="store.loading()"
              cssClass="mx-auto w-full"
            >
              {{ 'register' | translate }}
            </app-button>
          </app-form>

          <div
            class="text-center text-sm text-slate-500 dark:text-slate-400"
          >
            {{ 'alreadyHaveAccount' | translate }}
            <a
              routerLink="/login"
              class="text-slate-900 dark:text-white font-medium hover:underline"
            >
              {{ 'login' | translate }}
            </a>
          </div>
        </div>
      </app-card>
    </div>
  `,
})
export class RegisterComponent {
  readonly registerForm = inject(RegisterFormService);
  readonly store = inject(AuthStore);

  onSubmit(): void {
    const { confirmPassword, ...payload } =
      this.registerForm.form.getRawValue();
    this.store.register(payload);
  }
}
