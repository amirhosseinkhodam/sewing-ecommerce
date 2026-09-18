import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import type { AddressModel, AddressPayloadModel } from '@domain/models/address';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { TranslatePipe } from '@shared/pipes/translate';
import { ModalService } from '@shared/services/modal';
import { AddressFormComponent } from '../components/address-form';
import { AddressesStore } from '../store/addresses';

@Component({
  selector: 'app-addresses',
  imports: [
    ButtonComponent,
    CardComponent,
    LoadingSpinnerComponent,
    AddressFormComponent,
    TranslatePipe,
  ],
  providers: [AddressesStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {{ 'myAddresses' | translate }}
        </h1>
        @if (!formOpen()) {
          <app-button variant="primary" (buttonClick)="onAdd()">
            {{ 'addAddress' | translate }}
          </app-button>
        }
      </div>

      @if (store.loading() && store.addresses().length === 0) {
        <div class="flex justify-center py-20">
          <app-loading-spinner
            size="lg"
            cssClass="text-slate-400 dark:text-slate-500"
          />
        </div>
      } @else if (store.addresses().length === 0 && !formOpen()) {
        <div
          class="flex flex-col items-center gap-4 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center"
        >
          <p class="text-lg font-medium text-slate-900 dark:text-slate-100">
            {{ 'noAddresses' | translate }}
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ 'noAddressesMessage' | translate }}
          </p>
          <app-button variant="primary" (buttonClick)="onAdd()">
            {{ 'addAddress' | translate }}
          </app-button>
        </div>
      } @else {
        <div class="flex flex-col gap-6">
          @if (formOpen()) {
            <app-card variant="bordered">
              <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
                {{
                  (editingAddress() ? 'editAddress' : 'addNewAddress')
                    | translate
                }}
              </h2>
              <app-address-form
                [editingAddress]="editingAddress()"
                (saveAddress)="onSave($event)"
                (cancel)="onCancel()"
              />
            </app-card>
          }

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            @for (address of store.addresses(); track address.id) {
              <app-card variant="bordered">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2">
                    <p class="font-medium text-slate-900 dark:text-slate-100">
                      {{ address.label }}
                    </p>
                    @if (address.isDefault) {
                      <span
                        class="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                      >
                        {{ 'defaultAddress' | translate }}
                      </span>
                    }
                  </div>
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-300">
                  {{ address.province }} &middot; {{ address.city }}
                </p>
                <p class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {{ address.fullAddress }}
                </p>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {{ address.phone }}
                  @if (address.postalCode) {
                    &middot; {{ address.postalCode }}
                  }
                </p>
                <div
                  class="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700"
                >
                  @if (!address.isDefault) {
                    <app-button
                      variant="ghost"
                      size="sm"
                      (buttonClick)="onSetDefault(address)"
                    >
                      {{ 'setAsDefault' | translate }}
                    </app-button>
                  }
                  <app-button
                    variant="ghost"
                    size="sm"
                    (buttonClick)="onEdit(address)"
                  >
                    {{ 'edit' | translate }}
                  </app-button>
                  <app-button
                    variant="ghost"
                    size="sm"
                    cssClass="!text-red-600 dark:!text-red-400"
                    (buttonClick)="onDelete(address)"
                  >
                    {{ 'delete' | translate }}
                  </app-button>
                </div>
              </app-card>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class AddressesComponent {
  readonly store = inject(AddressesStore);

  readonly formOpen = signal(false);
  readonly editingAddress = signal<AddressModel | null>(null);

  readonly #modal = inject(ModalService);

  constructor() {
    this.store.load();
  }

  onAdd() {
    this.editingAddress.set(null);
    this.formOpen.set(true);
  }

  onEdit(address: AddressModel) {
    this.editingAddress.set(address);
    this.formOpen.set(true);
  }

  onSave(payload: AddressPayloadModel) {
    this.store.save({ id: this.editingAddress()?.id, payload });
    this.formOpen.set(false);
    this.editingAddress.set(null);
  }

  onCancel() {
    this.formOpen.set(false);
    this.editingAddress.set(null);
  }

  onSetDefault(address: AddressModel) {
    this.store.setDefault(address.id);
  }

  onDelete(address: AddressModel) {
    this.#modal
      .open({
        title: 'confirmDeleteTitle',
        description: 'confirmDeleteAddress',
        confirmLabel: 'delete',
        cancelLabel: 'cancel',
      })
      .then((confirmed) => {
        if (confirmed) this.store.remove(address.id);
      });
  }
}
