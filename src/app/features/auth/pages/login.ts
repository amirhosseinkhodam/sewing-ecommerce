import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { TranslatePipe } from "../../../shared/pipes/translate";
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
    TranslatePipe,
  ],
  template: `
    <div class="min-h-screen-80 flex items-center justify-center px-4">
      <app-card variant="bordered" [cssClass]="'max-w-md w-full'">
        <div class="flex flex-col gap-6">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ 'signInToAccount' | translate }}
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
              [label]="'email' | translate"
              [placeholder]="'email' | translate"
              autocomplete="email"
            />

            <app-input
              formControlName="password"
              type="password"
              [label]="'password' | translate"
              [placeholder]="'password' | translate"
              autocomplete="current-password"
            />

            <app-button
              type="submit"
              variant="primary"
              [disabled]="store.loading()"
            >
              @if (store.loading()) {
                {{ 'loading' | translate }}
              } @else {
                {{ 'login' | translate }}
              }
            </app-button>
          </form>

          <div class="text-center text-sm text-slate-500 dark:text-slate-400">
            {{ 'dontHaveAccount' | translate }}
            <a
              routerLink="/register"
              class="text-slate-900 dark:text-white font-medium hover:underline"
            >
              {{ 'register' | translate }}
            </a>
          </div>
        </div>
      </app-card>
    </div>
  `,
})
export class LoginComponent {
  readonly loginForm = inject(LoginFormService);
  readonly store = inject(AuthStore);

  onSubmit(): void {
    if (this.loginForm.form.invalid) return;
    this.store.login(this.loginForm.form.getRawValue());
  }
}
