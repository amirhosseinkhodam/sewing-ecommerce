import {
  Component,
  effect,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormField, submit } from '@angular/forms/signals';
import type { AddressModel, AddressPayloadModel } from '@domain/models/address';
import { ButtonComponent } from '@shared/components/button';
import { SignalFormComponent } from '@shared/components/signal-form';
import { SignalFormFieldComponent } from '@shared/components/signal-form-field';
import { InputComponent } from '@shared/components/input';
import { TextareaComponent } from '@shared/components/textarea';
import { ToggleComponent } from '@shared/components/toggle';
import { TranslatePipe } from '@shared/pipes/translate';
import { AddressFormService } from '../forms/address';

@Component({
  selector: 'app-address-form',
  imports: [
    FormField,
    ButtonComponent,
    SignalFormComponent,
    SignalFormFieldComponent,
    InputComponent,
    TextareaComponent,
    ToggleComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-signal-form (formSubmit)="onSubmit()" cssClass="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <app-input
            [formField]="addressForm.form.label"
            [label]="'addressLabel' | translate"
            [placeholder]="'addressLabel' | translate"
          />
          <app-signal-form-field [field]="addressForm.form.label" />
        </div>
        <div>
          <app-input
            [formField]="addressForm.form.phone"
            type="tel"
            [label]="'phone' | translate"
            [placeholder]="'phone' | translate"
          />
          <app-signal-form-field [field]="addressForm.form.phone" />
        </div>
        <div>
          <app-input
            [formField]="addressForm.form.province"
            [label]="'province' | translate"
            [placeholder]="'province' | translate"
          />
          <app-signal-form-field [field]="addressForm.form.province" />
        </div>
        <div>
          <app-input
            [formField]="addressForm.form.city"
            [label]="'city' | translate"
            [placeholder]="'city' | translate"
          />
          <app-signal-form-field [field]="addressForm.form.city" />
        </div>
      </div>

      <div>
        <app-textarea
          [formField]="addressForm.form.fullAddress"
          [rows]="3"
          [label]="'fullAddress' | translate"
          [placeholder]="'fullAddress' | translate"
        />
        <app-signal-form-field [field]="addressForm.form.fullAddress" />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <app-input
            [formField]="addressForm.form.postalCode"
            [label]="'postalCode' | translate"
            [placeholder]="'postalCode' | translate"
          />
          <app-signal-form-field [field]="addressForm.form.postalCode" />
        </div>
        <div class="flex items-end pb-3">
          <app-toggle
            [formField]="addressForm.form.isDefault"
            [label]="'setAsDefault' | translate"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <app-button variant="ghost" (buttonClick)="onCancel()">
          {{ 'cancel' | translate }}
        </app-button>
        <app-button type="submit" variant="primary">
          {{ 'save' | translate }}
        </app-button>
      </div>
    </app-signal-form>
  `,
})
export class AddressFormComponent {
  readonly editingAddress = input<AddressModel | null>(null);

  readonly saveAddress = output<AddressPayloadModel>();
  readonly cancel = output<void>();

  readonly addressForm = inject(AddressFormService);

  constructor() {
    effect(() => {
      const address = this.editingAddress();
      if (address) this.addressForm.patchFromAddress(address);
    });
  }

  onSubmit() {
    void submit(this.addressForm.form, async () => {
      this.saveAddress.emit(this.addressForm.model());
      this.addressForm.resetForm();
    });
  }

  onCancel() {
    this.addressForm.resetForm();
    this.cancel.emit();
  }
}
