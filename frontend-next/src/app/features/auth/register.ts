import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormField, email, form, required, submit, validate } from '@angular/forms/signals';
import type { RegisterPayload } from '@core/auth/auth.model';
import { AuthMutations } from '@core/auth/mutations';
import { apiErrorMessage } from '@core/http/api-error';
import { isIranianMobile, isPersonName, passwordWeaknesses } from '@shared/validation';
import { Notify } from '@shared/notify';

@Component({
  imports: [FormField, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <main class="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
      <mat-card class="w-full p-6">
        <mat-card-header><mat-card-title>ثبت نام</mat-card-title></mat-card-header
        ><mat-card-content>
          <form (submit)="onSubmit($event)" class="grid gap-3 sm:grid-cols-2">
            <mat-form-field
              ><mat-label>نام</mat-label><input matInput [formField]="registerForm.firstName"
            /></mat-form-field>
            <mat-form-field
              ><mat-label>نام خانوادگی</mat-label
              ><input matInput [formField]="registerForm.lastName"
            /></mat-form-field>
            <mat-form-field class="sm:col-span-2"
              ><mat-label>ایمیل</mat-label
              ><input matInput type="email" [formField]="registerForm.email"
            /></mat-form-field>
            <mat-form-field
              ><mat-label>تلفن</mat-label><input matInput [formField]="registerForm.phone"
            /></mat-form-field>
            <mat-form-field
              ><mat-label>رمز عبور</mat-label
              ><input matInput type="password" [formField]="registerForm.password"
            /></mat-form-field>
            <button
              matButton="filled"
              class="sm:col-span-2"
              type="submit"
              [disabled]="registerForm().invalid() || mutation.isPending()"
            >
              ثبت نام
            </button>
          </form></mat-card-content
        ></mat-card
      >
    </main>
  `,
})
export class Register {
  readonly mutation = inject(AuthMutations).register;
  readonly #router = inject(Router);
  readonly #notify = inject(Notify);
  protected readonly model = signal<RegisterPayload>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  protected readonly registerForm = form(this.model, (path) => {
    required(path.firstName);
    required(path.lastName);
    required(path.email);
    email(path.email);
    required(path.password);
    required(path.phone);
    validate(path.firstName, ({ value }) =>
      isPersonName(value())
        ? undefined
        : { kind: 'invalidChars', message: 'validation.invalidChars' },
    );
    validate(path.lastName, ({ value }) =>
      isPersonName(value())
        ? undefined
        : { kind: 'invalidChars', message: 'validation.invalidChars' },
    );
    validate(path.phone, ({ value }) =>
      isIranianMobile(value())
        ? undefined
        : { kind: 'invalidPhone', message: 'validation.invalidPhone' },
    );
    validate(path.password, ({ value }) =>
      passwordWeaknesses(value()).length
        ? { kind: 'weakPassword', message: 'validation.weakPasswordMinLength' }
        : undefined,
    );
  });
  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.registerForm, async () => {
      try {
        await this.mutation.mutateAsync(this.model());
        await this.#router.navigateByUrl('/');
      } catch (error) {
        this.#notify.show(apiErrorMessage(error, 'ثبت نام ناموفق بود'));
      }
    });
  }
}
