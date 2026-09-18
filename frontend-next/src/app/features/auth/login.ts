import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import type { LoginPayload } from '@core/auth/auth.model';
import { AuthMutations } from '@core/auth/mutations';
import { apiErrorMessage } from '@core/http/api-error';
import { Notify } from '@shared/notify';

@Component({
  imports: [FormField, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <main class="mx-auto flex min-h-screen max-w-md items-center px-4 py-8">
      <mat-card class="w-full p-6">
        <mat-card-header><mat-card-title>ورود</mat-card-title></mat-card-header>
        <mat-card-content>
          <form (submit)="onSubmit($event)" class="flex flex-col gap-3">
            <mat-form-field
              ><mat-label>ایمیل</mat-label
              ><input matInput type="email" [formField]="loginForm.email" />
              @for (error of loginForm.email().errors(); track error.kind) {
                <mat-error>{{ error.message }}</mat-error>
              }
            </mat-form-field>
            <mat-form-field
              ><mat-label>رمز عبور</mat-label
              ><input matInput type="password" [formField]="loginForm.password" />
              @for (error of loginForm.password().errors(); track error.kind) {
                <mat-error>{{ error.message }}</mat-error>
              }
            </mat-form-field>
            <button
              matButton="filled"
              type="submit"
              [disabled]="loginForm().invalid() || mutation.isPending()"
            >
              ورود
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </main>
  `,
})
export class Login {
  readonly mutation = inject(AuthMutations).login;
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #notify = inject(Notify);
  protected readonly model = signal<LoginPayload>({ email: '', password: '' });
  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: 'validation.required' });
    email(path.email, { message: 'validation.email' });
    required(path.password, { message: 'validation.required' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.loginForm, async () => {
      try {
        await this.mutation.mutateAsync(this.model());
        const returnUrl = this.#route.snapshot.queryParamMap.get('returnUrl') ?? '/';
        await this.#router.navigateByUrl(returnUrl.startsWith('/') ? returnUrl : '/');
      } catch (error) {
        this.#notify.show(apiErrorMessage(error, 'ورود ناموفق بود'));
      }
    });
  }
}
