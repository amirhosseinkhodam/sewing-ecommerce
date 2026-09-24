import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormField, submit } from '@angular/forms/signals';
import { TranslatePipe } from '@shared/pipes/translate';
import { CardComponent } from '@shared/components/card';
import { ButtonComponent } from '@shared/components/button';
import { InputComponent } from '@shared/components/input';
import { SignalFormComponent } from '@shared/components/signal-form';
import { SignalFormFieldComponent } from '@shared/components/signal-form-field';
import { LoginFormService } from '../forms/login';
import { AuthStore } from '../store/auth';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    FormField,
    CardComponent,
    ButtonComponent,
    InputComponent,
    SignalFormComponent,
    SignalFormFieldComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="min-h-screen-80 flex items-center justify-center px-4">
      <app-card variant="bordered" [cssClass]="'max-w-md w-full'">
        <div class="flex flex-col gap-6">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ 'signInToAccount' | translate }}
            </h1>
          </div>

          <app-signal-form
            (formSubmit)="onSubmit()"
            cssClass="flex flex-col gap-4"
          >
            <div>
              <app-input
                [formField]="loginForm.form.email"
                type="email"
                [label]="'email' | translate"
                [placeholder]="'email' | translate"
                autocomplete="email"
              />
              <app-signal-form-field [field]="loginForm.form.email" />
            </div>

            <div>
              <app-input
                [formField]="loginForm.form.password"
                type="password"
                [label]="'password' | translate"
                [placeholder]="'password' | translate"
                autocomplete="current-password"
              />
              <app-signal-form-field [field]="loginForm.form.password" />
            </div>

            <app-button
              type="submit"
              variant="primary"
              [loading]="store.loading()"
              cssClass="mx-auto w-full"
            >
              {{ 'login' | translate }}
            </app-button>
          </app-signal-form>

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

  readonly #route = inject(ActivatedRoute);

  onSubmit(): void {
    void submit(this.loginForm.form, async () => {
      this.store.login({
        payload: this.loginForm.model(),
        returnUrl:
          this.#route.snapshot.queryParamMap.get('returnUrl') ?? undefined,
      });
    });
  }
}
