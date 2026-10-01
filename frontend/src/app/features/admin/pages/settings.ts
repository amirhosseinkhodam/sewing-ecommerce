import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { FormField, submit } from '@angular/forms/signals';

import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { InputComponent } from '@shared/components/input';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { SignalFormComponent } from '@shared/components/signal-form';
import { SignalFormFieldComponent } from '@shared/components/signal-form-field';
import { TextareaComponent } from '@shared/components/textarea';
import { TranslatePipe } from '@shared/pipes/translate';
import { SettingsFormService } from '../../settings/forms/settings';
import { AdminSettingsStore } from '../store/settings';

@Component({
  selector: 'app-admin-settings',
  imports: [
    ButtonComponent,
    CardComponent,
    FormField,
    InputComponent,
    LoadingSpinnerComponent,
    SignalFormComponent,
    SignalFormFieldComponent,
    TextareaComponent,
    TranslatePipe,
  ],
  providers: [AdminSettingsStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {{ 'settings' | translate }}
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ 'settingsDescription' | translate }}
        </p>
      </div>

      @if (store.loading()) {
        <div class="flex justify-center py-16">
          <app-loading-spinner
            size="lg"
            cssClass="text-slate-400 dark:text-slate-500"
          />
        </div>
      } @else {
        <app-signal-form
          (formSubmit)="onSubmit()"
          cssClass="flex flex-col gap-6"
        >
          <app-card variant="bordered">
            <h2
              class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {{ 'shopDetails' | translate }}
            </h2>
            <div class="flex flex-col gap-4">
              <div>
                <app-input
                  [formField]="settingsForm.form.shopName"
                  [label]="'shopName' | translate"
                />
                <app-signal-form-field [field]="settingsForm.form.shopName" />
              </div>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <app-input
                    type="tel"
                    [formField]="settingsForm.form.shopPhone"
                    [label]="'phoneNumber' | translate"
                  />
                  <app-signal-form-field
                    [field]="settingsForm.form.shopPhone"
                  />
                </div>
                <div>
                  <app-input
                    type="email"
                    [formField]="settingsForm.form.shopEmail"
                    [label]="'email' | translate"
                  />
                  <app-signal-form-field
                    [field]="settingsForm.form.shopEmail"
                  />
                </div>
              </div>
              <div>
                <app-textarea
                  [formField]="settingsForm.form.shopAddress"
                  [label]="'address' | translate"
                  [rows]="2"
                />
                <app-signal-form-field
                  [field]="settingsForm.form.shopAddress"
                />
              </div>
              <div>
                <app-input
                  [formField]="settingsForm.form.businessHours"
                  [label]="'businessHours' | translate"
                />
                <app-signal-form-field
                  [field]="settingsForm.form.businessHours"
                />
              </div>
            </div>
          </app-card>

          <app-card variant="bordered">
            <h2
              class="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {{ 'bankCardSettings' | translate }}
            </h2>
            <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">
              {{ 'bankCardSettingsHint' | translate }}
            </p>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <app-input
                  [formField]="settingsForm.form.bankCardNumber"
                  [label]="'cardNumber' | translate"
                  cssClass="font-mono"
                />
                <app-signal-form-field
                  [field]="settingsForm.form.bankCardNumber"
                />
              </div>
              <div>
                <app-input
                  [formField]="settingsForm.form.bankCardHolder"
                  [label]="'cardHolder' | translate"
                />
                <app-signal-form-field
                  [field]="settingsForm.form.bankCardHolder"
                />
              </div>
            </div>
          </app-card>

          <app-card variant="bordered">
            <h2
              class="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {{ 'shippingSettings' | translate }}
            </h2>
            <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">
              {{ 'shippingSettingsHint' | translate }}
            </p>
            <div class="flex flex-col gap-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <app-input
                    type="number"
                    [formField]="settingsForm.form.postPrice"
                    [label]="'postPrice' | translate"
                  />
                  <app-signal-form-field
                    [field]="settingsForm.form.postPrice"
                  />
                </div>
                <div>
                  <app-input
                    type="number"
                    [formField]="settingsForm.form.postEtaDays"
                    [label]="'postEtaDays' | translate"
                  />
                  <app-signal-form-field
                    [field]="settingsForm.form.postEtaDays"
                  />
                </div>
              </div>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <app-input
                    type="number"
                    [formField]="settingsForm.form.courierPrice"
                    [label]="'courierPrice' | translate"
                  />
                  <app-signal-form-field
                    [field]="settingsForm.form.courierPrice"
                  />
                </div>
                <div>
                  <app-input
                    type="number"
                    [formField]="settingsForm.form.courierEtaDays"
                    [label]="'courierEtaDays' | translate"
                  />
                  <app-signal-form-field
                    [field]="settingsForm.form.courierEtaDays"
                  />
                </div>
              </div>
            </div>
          </app-card>

          <div class="flex gap-3">
            <app-button
              type="submit"
              variant="primary"
              [loading]="store.saving()"
            >
              {{ 'save' | translate }}
            </app-button>
          </div>
        </app-signal-form>
      }
    </div>
  `,
})
export class AdminSettingsComponent {
  readonly store = inject(AdminSettingsStore);
  readonly settingsForm = inject(SettingsFormService);

  constructor() {
    // The form is seeded from the query rather than from a route resolver, so
    // it also picks up the refetched row after a save.
    effect(() => {
      const settings = this.store.settings();
      if (settings) this.settingsForm.patchFromSettings(settings);
    });
  }

  onSubmit() {
    void submit(this.settingsForm.form, async () => {
      this.store.save(this.settingsForm.payload);
    });
  }
}
