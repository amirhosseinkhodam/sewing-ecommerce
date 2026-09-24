import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormField, submit } from '@angular/forms/signals';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  Location01Icon,
  Mail01Icon,
  SmartPhone01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { SignalFormComponent } from '@shared/components/signal-form';
import { SignalFormFieldComponent } from '@shared/components/signal-form-field';
import { InputComponent } from '@shared/components/input';
import { TextareaComponent } from '@shared/components/textarea';
import { TranslatePipe } from '@shared/pipes/translate';
import { SHOP_CONTACT } from '../const/shop-contact';
import { ContactFormService } from '../forms/contact';
import { injectSubmitContactMutation } from '../mutation/contact';

@Component({
  selector: 'app-contact',
  imports: [
    FormField,
    ButtonComponent,
    CardComponent,
    SignalFormComponent,
    SignalFormFieldComponent,
    HugeiconsIconComponent,
    InputComponent,
    TextareaComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {{ 'contactUs' | translate }}
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-8">
        {{ 'getInTouch' | translate }}
      </p>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <app-card variant="bordered" cssClass="lg:col-span-2">
          <app-signal-form
            (formSubmit)="onSubmit()"
            cssClass="flex flex-col gap-4"
          >
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <app-input
                  [formField]="contactForm.form.name"
                  [label]="'name' | translate"
                  [placeholder]="'name' | translate"
                />
                <app-signal-form-field [field]="contactForm.form.name" />
              </div>
              <div>
                <app-input
                  [formField]="contactForm.form.email"
                  type="email"
                  [label]="'email' | translate"
                  [placeholder]="'email' | translate"
                />
                <app-signal-form-field [field]="contactForm.form.email" />
              </div>
            </div>

            <div>
              <app-input
                [formField]="contactForm.form.phone"
                type="tel"
                [label]="'phoneNumber' | translate"
                [placeholder]="'optional' | translate"
              />
              <app-signal-form-field [field]="contactForm.form.phone" />
            </div>

            <div>
              <app-textarea
                [formField]="contactForm.form.message"
                [label]="'message' | translate"
                [placeholder]="'message' | translate"
                [rows]="6"
              />
              <app-signal-form-field
                [field]="contactForm.form.message"
                [requiredLength]="10"
              />
            </div>

            <div>
              <app-button
                type="submit"
                variant="primary"
                [loading]="submitMessage.isPending()"
              >
                {{ 'sendMessage' | translate }}
              </app-button>
            </div>
          </app-signal-form>
        </app-card>

        <app-card variant="bordered" cssClass="h-fit">
          <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
            {{ 'contactUs' | translate }}
          </h2>
          <div class="flex flex-col gap-4">
            <div class="flex items-start gap-3">
              <hugeicons-icon
                [icon]="icons.Location01Icon"
                [size]="18"
                color="currentColor"
                [strokeWidth]="1.5"
                class="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0"
              />
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ 'address' | translate }}
                </p>
                <p class="text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                  {{ shop.address }}
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <hugeicons-icon
                [icon]="icons.SmartPhone01Icon"
                [size]="18"
                color="currentColor"
                [strokeWidth]="1.5"
                class="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0"
              />
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ 'phoneNumber' | translate }}
                </p>
                <p
                  class="text-sm text-slate-900 dark:text-slate-100 mt-0.5"
                  dir="ltr"
                >
                  {{ shop.phone }}
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <hugeicons-icon
                [icon]="icons.Mail01Icon"
                [size]="18"
                color="currentColor"
                [strokeWidth]="1.5"
                class="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0"
              />
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ 'email' | translate }}
                </p>
                <p
                  class="text-sm text-slate-900 dark:text-slate-100 mt-0.5"
                  dir="ltr"
                >
                  {{ shop.email }}
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <hugeicons-icon
                [icon]="icons.Clock01Icon"
                [size]="18"
                color="currentColor"
                [strokeWidth]="1.5"
                class="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0"
              />
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ 'workingHours' | translate }}
                </p>
                <p class="text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                  {{ 'shopWorkingHours' | translate }}
                </p>
              </div>
            </div>
          </div>
        </app-card>
      </div>
    </div>
  `,
})
export class ContactComponent {
  readonly contactForm = inject(ContactFormService);

  readonly icons = {
    Location01Icon,
    Mail01Icon,
    SmartPhone01Icon,
    Clock01Icon,
  };
  readonly shop = SHOP_CONTACT;

  readonly submitMessage = injectSubmitContactMutation({
    onSuccess: () => this.contactForm.resetForm(),
  });

  onSubmit(): void {
    void submit(this.contactForm.form, async () => {
      // The mutation reports both outcomes; swallow the rejection so it does
      // not surface as an unhandled promise.
      await this.submitMessage
        .mutateAsync(this.contactForm.payload)
        .catch(() => undefined);
    });
  }
}
