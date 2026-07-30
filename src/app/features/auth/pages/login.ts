import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { LanguageService } from "../../../shared/services/language";
import { CardComponent } from "../../../shared/components/card";
import { ButtonComponent } from "../../../shared/components/button";
import { InputComponent } from "../../../shared/components/input";
import { LoginFormService } from "../forms/login";
import { AuthStore } from "../store/auth";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
  ],
  template: `
    <div class="min-h-screen-80 flex items-center justify-center px-4">
      <app-card variant="bordered" [cssClass]="'max-w-md w-full'">
        <div class="flex flex-col gap-6">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ t("signInToAccount") }}
            </h1>
          </div>

          <form
            [formGroup]="loginForm.form"
            (ngSubmit)="onSubmit()"
            class="flex flex-col gap-4"
          >
            <app-input
              formControlName="email"
              type="email"
              [label]="t('email')"
              [placeholder]="t('email')"
              autocomplete="email"
            />

            <app-input
              formControlName="password"
              type="password"
              [label]="t('password')"
              [placeholder]="t('password')"
              autocomplete="current-password"
            />

            <app-button
              type="submit"
              variant="primary"
              [disabled]="store.loading()"
            >
              @if (store.loading()) {
                {{ t("loading") }}
              } @else {
                {{ t("login") }}
              }
            </app-button>
          </form>

          <div class="text-center text-sm text-slate-500 dark:text-slate-400">
            {{ t("dontHaveAccount") }}
            <a
              routerLink="/register"
              class="text-slate-900 dark:text-white font-medium hover:underline"
            >
              {{ t("register") }}
            </a>
          </div>
        </div>
      </app-card>
    </div>
  `,
})
export class LoginComponent {
  readonly #languageService = inject(LanguageService);
  readonly loginForm = inject(LoginFormService);
  readonly store = inject(AuthStore);

  t(key: string): string {
    return this.#languageService.translate(key);
  }

  onSubmit(): void {
    if (this.loginForm.form.invalid) return;
    this.store.login(this.loginForm.form.getRawValue());
  }
}
