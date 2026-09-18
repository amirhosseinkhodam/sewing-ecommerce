import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import type { UpdateProfilePayload } from '@core/auth/auth.model';
import { AuthSessionStore } from '@core/auth/session';
import { AuthMutations } from '@core/auth/mutations';
import { apiErrorMessage } from '@core/http/api-error';
import { Notify } from '@shared/notify';

@Component({
  imports: [FormField, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: ` <main class="mx-auto max-w-lg px-4 py-8">
    <mat-card class="p-6"
      ><mat-card-header><mat-card-title>پروفایل</mat-card-title></mat-card-header
      ><mat-card-content>
        <form (submit)="onSubmit($event)" class="flex flex-col gap-3">
          <mat-form-field
            ><mat-label>نام</mat-label
            ><input matInput [formField]="profileForm.firstName" /></mat-form-field
          ><mat-form-field
            ><mat-label>نام خانوادگی</mat-label
            ><input matInput [formField]="profileForm.lastName" /></mat-form-field
          ><mat-form-field
            ><mat-label>ایمیل</mat-label
            ><input matInput type="email" [formField]="profileForm.email" /></mat-form-field
          ><mat-form-field
            ><mat-label>تلفن</mat-label
            ><input matInput [formField]="profileForm.phone" /></mat-form-field
          ><button
            matButton="filled"
            type="submit"
            [disabled]="profileForm().invalid() || mutation.isPending()"
          >
            ذخیره
          </button>
        </form>
      </mat-card-content></mat-card
    >
  </main>`,
})
export class Profile {
  readonly mutation = inject(AuthMutations).updateProfile;
  readonly #session = inject(AuthSessionStore);
  readonly #notify = inject(Notify);
  protected readonly model = signal({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  protected readonly profileForm = form(this.model, (path) => {
    required(path.firstName);
    required(path.lastName);
    required(path.email);
    email(path.email);
    required(path.phone);
  });
  constructor() {
    const user = this.#session.user();
    if (user)
      this.model.set({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      });
  }
  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.profileForm, async () => {
      try {
        await this.mutation.mutateAsync(this.model() as UpdateProfilePayload);
        this.#notify.show('پروفایل با موفقیت به‌روزرسانی شد');
      } catch (error) {
        this.#notify.show(apiErrorMessage(error, 'ذخیره ناموفق بود'));
      }
    });
  }
}
