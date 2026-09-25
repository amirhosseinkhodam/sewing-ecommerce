import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, submit } from '@angular/forms/signals';
import { TranslatePipe } from '@shared/pipes/translate';
import { CardComponent } from '@shared/components/card';
import { ButtonComponent } from '@shared/components/button';
import { InputComponent } from '@shared/components/input';
import { SignalFormComponent } from '@shared/components/signal-form';
import { SignalFormFieldComponent } from '@shared/components/signal-form-field';
import { ProfileFormService } from '../forms/profile';
import { injectUpdateProfileMutation } from '../mutation/profile';
import { AuthStore } from '../store/auth';

@Component({
  selector: 'app-profile',
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
    <div class="max-w-2xl mx-auto px-4 py-8">
      @if (store.user(); as user) {
        <app-card variant="bordered">
          <div class="flex flex-col gap-6">
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-500 dark:text-slate-400"
              >
                {{ user.firstName[0] }}{{ user.lastName[0] }}
              </div>
              <div>
                <h1
                  class="text-xl font-bold text-slate-900 dark:text-slate-100"
                >
                  {{ user.firstName }} {{ user.lastName }}
                </h1>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  {{ user.email }}
                </p>
              </div>
            </div>

            @if (editing()) {
              <app-signal-form
                (formSubmit)="onSubmit()"
                cssClass="flex flex-col gap-4"
              >
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <app-input
                      [formField]="profileForm.form.firstName"
                      [label]="'firstName' | translate"
                      [placeholder]="'firstName' | translate"
                      autocomplete="given-name"
                    />
                    <app-signal-form-field
                      [field]="profileForm.form.firstName"
                      [requiredLength]="2"
                    />
                  </div>
                  <div>
                    <app-input
                      [formField]="profileForm.form.lastName"
                      [label]="'lastName' | translate"
                      [placeholder]="'lastName' | translate"
                      autocomplete="family-name"
                    />
                    <app-signal-form-field
                      [field]="profileForm.form.lastName"
                      [requiredLength]="2"
                    />
                  </div>
                  <div>
                    <app-input
                      [formField]="profileForm.form.email"
                      type="email"
                      [label]="'email' | translate"
                      [placeholder]="'email' | translate"
                      autocomplete="email"
                    />
                    <app-signal-form-field [field]="profileForm.form.email" />
                  </div>
                  <div>
                    <app-input
                      [formField]="profileForm.form.phone"
                      type="tel"
                      [label]="'phone' | translate"
                      [placeholder]="'phone' | translate"
                      autocomplete="tel"
                    />
                    <app-signal-form-field [field]="profileForm.form.phone" />
                  </div>
                </div>

                <div class="flex justify-end gap-2">
                  <app-button variant="ghost" (buttonClick)="onCancel()">
                    {{ 'cancel' | translate }}
                  </app-button>
                  <app-button
                    type="submit"
                    variant="primary"
                    [loading]="updateProfile.isPending()"
                  >
                    {{ 'save' | translate }}
                  </app-button>
                </div>
              </app-signal-form>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ 'firstName' | translate }}
                  </p>
                  <p
                    class="text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    {{ user.firstName }}
                  </p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ 'lastName' | translate }}
                  </p>
                  <p
                    class="text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    {{ user.lastName }}
                  </p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ 'email' | translate }}
                  </p>
                  <p
                    class="text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    {{ user.email }}
                  </p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ 'phone' | translate }}
                  </p>
                  <p
                    class="text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    {{ user.phone }}
                  </p>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row gap-3">
                <app-button variant="primary" (buttonClick)="onEdit()">
                  {{ 'editProfile' | translate }}
                </app-button>
                <app-button variant="secondary" routerLink="/orders">
                  {{ 'myOrders' | translate }}
                </app-button>
                <app-button variant="secondary" routerLink="/addresses">
                  {{ 'myAddresses' | translate }}
                </app-button>
                <app-button
                  variant="destructive"
                  (buttonClick)="store.logout()"
                >
                  {{ 'logout' | translate }}
                </app-button>
              </div>
            }
          </div>
        </app-card>
      } @else if (store.profileLoading()) {
        <div class="flex items-center justify-center py-20">
          <p class="text-slate-500 dark:text-slate-400">
            {{ 'loading' | translate }}
          </p>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <p class="text-slate-500 dark:text-slate-400">
            {{ 'loginRequired' | translate }}
          </p>
          <app-button variant="primary" routerLink="/login">
            {{ 'login' | translate }}
          </app-button>
        </div>
      }
    </div>
  `,
})
export class ProfileComponent {
  readonly store = inject(AuthStore);
  readonly profileForm = inject(ProfileFormService);

  readonly editing = signal(false);

  readonly updateProfile = injectUpdateProfileMutation({
    onSuccess: () => this.editing.set(false),
  });

  onEdit(): void {
    const user = this.store.user();
    if (!user) return;
    this.profileForm.patchFromUser(user);
    this.editing.set(true);
  }

  onCancel(): void {
    this.profileForm.resetForm();
    this.editing.set(false);
  }

  onSubmit(): void {
    void submit(this.profileForm.form, async () => {
      this.updateProfile.mutate(this.profileForm.model());
    });
  }
}
