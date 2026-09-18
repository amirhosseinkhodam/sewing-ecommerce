import {
  Component,
  effect,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import type { AddressModel, AddressPayloadModel } from '@domain/models/address';
import { ButtonComponent } from '@shared/components/button';
import { FormComponent } from '@shared/components/form';
import { FormFieldComponent } from '@shared/components/form-field';
import { InputComponent } from '@shared/components/input';
import { TextareaComponent } from '@shared/components/textarea';
import { ToggleComponent } from '@shared/components/toggle';
import { TranslatePipe } from '@shared/pipes/translate';
import { AddressFormService } from '../forms/address';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    FormComponent,
    FormFieldComponent,
    InputComponent,
    TextareaComponent,
    ToggleComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-form
      [formGroup]="addressForm.form"
      (formSubmit)="onSubmit()"
      cssClass="flex flex-col gap-4"
    >
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <app-input
            formControlName="label"
            [label]="'addressLabel' | translate"
            [placeholder]="'addressLabel' | translate"
          />
          <app-form-field [control]="addressForm.form.get('label')!" />
        </div>
        <div>
          <app-input
            formControlName="phone"
            type="tel"
            [label]="'phone' | translate"
            [placeholder]="'phone' | translate"
          />
          <app-form-field [control]="addressForm.form.get('phone')!" />
        </div>
        <div>
          <app-input
            formControlName="province"
            [label]="'province' | translate"
            [placeholder]="'province' | translate"
          />
          <app-form-field [control]="addressForm.form.get('province')!" />
        </div>
        <div>
          <app-input
            formControlName="city"
            [label]="'city' | translate"
            [placeholder]="'city' | translate"
          />
          <app-form-field [control]="addressForm.form.get('city')!" />
        </div>
      </div>

      <div>
        <app-textarea
          formControlName="fullAddress"
          [rows]="3"
          [label]="'fullAddress' | translate"
          [placeholder]="'fullAddress' | translate"
        />
        <app-form-field [control]="addressForm.form.get('fullAddress')!" />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <app-input
            formControlName="postalCode"
            [label]="'postalCode' | translate"
            [placeholder]="'postalCode' | translate"
          />
          <app-form-field [control]="addressForm.form.get('postalCode')!" />
        </div>
        <div class="flex items-end pb-3">
          <app-toggle
            formControlName="isDefault"
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
    </app-form>
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
    this.saveAddress.emit(this.addressForm.form.getRawValue());
    this.addressForm.resetForm();
  }

  onCancel() {
    this.addressForm.resetForm();
    this.cancel.emit();
  }
}
