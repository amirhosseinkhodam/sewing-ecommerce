import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { TranslatePipe } from "../../../shared/pipes/translate";
import { CardComponent } from "../../../shared/components/card";
import { ButtonComponent } from "../../../shared/components/button";
import { InputComponent } from "../../../shared/components/input";
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
    TranslatePipe,
  ],
  template: `
    <div class="min-h-screen-80 flex items-center justify-center px-4 py-8">
      <app-card variant="bordered" [cssClass]="'max-w-md w-full'">
        <div class="flex flex-col gap-6">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ 'createAccount' | translate }}
            </h1>
          </div>

          @if (
            registerForm.form.errors?.["passwordsDoNotMatch"] &&
            registerForm.form.touched
          ) {
            <div
              class="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg"
            >
              {{ 'passwordsDoNotMatch' | translate }}
            </div>
          }

          <form
            [formGroup]="registerForm.form"
            (ngSubmit)="onSubmit()"
            class="flex flex-col gap-4"
          >
            <div class="grid grid-cols-2 gap-4">
              <app-input
                formControlName="firstName"
                type="text"
                [label]="'firstName' | translate"
                [placeholder]="'firstName' | translate"
              />
              <app-input
                formControlName="lastName"
                type="text"
                [label]="'lastName' | translate"
                [placeholder]="'lastName' | translate"
              />
            </div>

            <app-input
              formControlName="email"
              type="email"
              [label]="'email' | translate"
              [placeholder]="'email' | translate"
              autocomplete="email"
            />

            <app-input
              formControlName="phone"
              type="text"
              [label]="'phone' | translate"
              [placeholder]="'phone' | translate"
              autocomplete="tel"
            />

            <app-input
              formControlName="password"
              type="password"
              [label]="'password' | translate"
              [placeholder]="'password' | translate"
              autocomplete="new-password"
            />

            <app-input
              formControlName="confirmPassword"
              type="password"
              [label]="'confirmPassword' | translate"
              [placeholder]="'confirmPassword' | translate"
              autocomplete="new-password"
            />

            <app-button
              type="submit"
              variant="primary"
              [disabled]="store.loading()"
            >
              @if (store.loading()) {
                {{ 'loading' | translate }}
              } @else {
                {{ 'register' | translate }}
              }
            </app-button>
          </form>

          <div class="text-center text-sm text-slate-500 dark:text-slate-400">
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
    if (this.registerForm.form.invalid) return;
    const { confirmPassword, ...payload } =
      this.registerForm.form.getRawValue();
    if (payload.password !== confirmPassword) {
      this.registerForm.form.setErrors({ passwordsDoNotMatch: true });
      return;
    }
    this.store.register(payload);
  }
}
