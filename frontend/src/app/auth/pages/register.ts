import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, submit } from '@angular/forms/signals';
import { TranslatePipe } from '@shared/pipes/translate';
import { CardComponent } from '@shared/components/card';
import { ButtonComponent } from '@shared/components/button';
import { InputComponent } from '@shared/components/input';
import { SignalFormComponent } from '@shared/components/signal-form';
import { SignalFormFieldComponent } from '@shared/components/signal-form-field';
import { RegisterFormService } from '../forms/register';
import { AuthStore } from '../store/auth';

@Component({
  selector: 'app-register',
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
    <div class="min-h-screen-80 flex items-center justify-center px-4 py-8">
      <app-card variant="bordered" [cssClass]="'max-w-md w-full'">
        <div class="flex flex-col gap-6">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ 'createAccount' | translate }}
            </h1>
          </div>

          <app-signal-form
            (formSubmit)="onSubmit()"
            cssClass="flex flex-col gap-4"
          >
            <div class="grid grid-cols-2 gap-4">
              <div>
                <app-input
                  [formField]="registerForm.form.firstName"
                  type="text"
                  [label]="'firstName' | translate"
                  [placeholder]="'firstName' | translate"
                />
                <app-signal-form-field
                  [field]="registerForm.form.firstName"
                  [requiredLength]="2"
                />
              </div>
              <div>
                <app-input
                  [formField]="registerForm.form.lastName"
                  type="text"
                  [label]="'lastName' | translate"
                  [placeholder]="'lastName' | translate"
                />
                <app-signal-form-field
                  [field]="registerForm.form.lastName"
                  [requiredLength]="2"
                />
              </div>
            </div>

            <div>
              <app-input
                [formField]="registerForm.form.email"
                type="email"
                [label]="'email' | translate"
                [placeholder]="'email' | translate"
                autocomplete="email"
              />
              <app-signal-form-field [field]="registerForm.form.email" />
            </div>

            <div>
              <app-input
                [formField]="registerForm.form.phone"
                type="text"
                [label]="'phone' | translate"
                [placeholder]="'phone' | translate"
                autocomplete="tel"
              />
              <app-signal-form-field [field]="registerForm.form.phone" />
            </div>

            <div>
              <app-input
                [formField]="registerForm.form.password"
                type="password"
                [label]="'password' | translate"
                [placeholder]="'password' | translate"
                autocomplete="new-password"
              />
              <app-signal-form-field [field]="registerForm.form.password" />
            </div>

            <div>
              <app-input
                [formField]="registerForm.form.confirmPassword"
                type="password"
                [label]="'confirmPassword' | translate"
                [placeholder]="'confirmPassword' | translate"
                autocomplete="new-password"
              />
              <app-signal-form-field
                [field]="registerForm.form.confirmPassword"
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
          </app-signal-form>

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
    void submit(this.registerForm.form, async () => {
      const { confirmPassword: _confirmPassword, ...payload } =
        this.registerForm.model();
      this.store.register(payload);
    });
  }
}
