import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  Location01Icon,
  Mail01Icon,
  SmartPhone01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { FormComponent } from '@shared/components/form';
import { FormFieldComponent } from '@shared/components/form-field';
import { InputComponent } from '@shared/components/input';
import { TextareaComponent } from '@shared/components/textarea';
import { TranslatePipe } from '@shared/pipes/translate';
import { LanguageService } from '@shared/services/language';
import { NotificationService } from '@shared/services/notification';
import { SHOP_CONTACT } from '../const/shop-contact';
import { ContactFormService } from '../forms/contact';
import { ContactService } from '../services/contact';

@Component({
  selector: 'app-contact',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
    FormComponent,
    FormFieldComponent,
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
          <app-form
            [formGroup]="contactForm.form"
            (formSubmit)="onSubmit()"
            cssClass="flex flex-col gap-4"
          >
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <app-input
                  formControlName="name"
                  [label]="'name' | translate"
                  [placeholder]="'name' | translate"
                />
                <app-form-field [control]="contactForm.form.get('name')!" />
              </div>
              <div>
                <app-input
                  formControlName="email"
                  type="email"
                  [label]="'email' | translate"
                  [placeholder]="'email' | translate"
                />
                <app-form-field [control]="contactForm.form.get('email')!" />
              </div>
            </div>

            <div>
              <app-input
                formControlName="phone"
                type="tel"
                [label]="'phoneNumber' | translate"
                [placeholder]="'optional' | translate"
              />
              <app-form-field [control]="contactForm.form.get('phone')!" />
            </div>

            <div>
              <app-textarea
                formControlName="message"
                [label]="'message' | translate"
                [placeholder]="'message' | translate"
                [rows]="6"
              />
              <app-form-field [control]="contactForm.form.get('message')!" />
            </div>

            <div>
              <app-button
                type="submit"
                variant="primary"
                [loading]="submitting()"
              >
                {{ 'sendMessage' | translate }}
              </app-button>
            </div>
          </app-form>
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

  readonly submitting = signal(false);

  readonly #contact = inject(ContactService);
  readonly #notification = inject(NotificationService);
  readonly #language = inject(LanguageService);

  onSubmit() {
    if (this.contactForm.form.invalid) {
      this.contactForm.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.#contact.submit(this.contactForm.payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.contactForm.resetForm();
        this.#notification.show(
          'success',
          this.#language.translate('messageSent'),
        );
      },
      error: () => {
        this.submitting.set(false);
        this.#notification.show(
          'error',
          this.#language.translate('couldNotSave'),
        );
      },
    });
  }
}
