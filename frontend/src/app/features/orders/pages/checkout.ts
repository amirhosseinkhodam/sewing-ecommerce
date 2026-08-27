import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import type { AddressModel, AddressPayloadModel } from '@domain/models/address';
import { PAYMENT_METHODS } from '@domain/const/payment-methods';
import type { ShippingMethod } from '@domain/const/shipping-methods';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { AddressFormComponent } from '../../addresses/components/address-form';
import { CartStore } from '../../cart/store/cart';
import { SHIPPING_OPTIONS } from '../const/shipping-options';
import { CheckoutStore } from '../store/checkout';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    NgClass,
    ButtonComponent,
    CardComponent,
    LoadingSpinnerComponent,
    LocalizedNumberPipe,
    AddressFormComponent,
    TranslatePipe,
  ],
  providers: [CheckoutStore],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
        {{ 'checkout' | translate }}
      </h1>

      @if (cartStore.items().length === 0) {
        <div
          class="flex flex-col items-center gap-4 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center"
        >
          <p class="text-lg font-medium text-slate-900 dark:text-slate-100">
            {{ 'cartEmpty' | translate }}
          </p>
          <app-button variant="primary" (buttonClick)="onStartShopping()">
            {{ 'startShopping' | translate }}
          </app-button>
        </div>
      } @else {
        <ol class="flex items-center gap-2 mb-8 text-sm">
          @for (stepLabel of stepLabels; track stepLabel; let i = $index) {
            <li class="flex items-center gap-2">
              <span
                class="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                [class]="
                  i === currentStep()
                    ? 'bg-slate-900 dark:bg-slate-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                "
              >
                {{ i + 1 }}
              </span>
              <span
                class="hidden sm:inline font-medium"
                [ngClass]="
                  i === currentStep()
                    ? 'text-slate-900 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400'
                "
              >
                {{ stepLabel | translate }}
              </span>
              @if (i < stepLabels.length - 1) {
                <span class="text-slate-300 dark:text-slate-600">&mdash;</span>
              }
            </li>
          }
        </ol>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div class="lg:col-span-2">
            @switch (currentStep()) {
              @case (0) {
                <app-card variant="bordered">
                  <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
                    {{ 'shippingAddress' | translate }}
                  </h2>
                  @if (checkoutStore.loadingAddresses()) {
                    <div class="flex justify-center py-10">
                      <app-loading-spinner
                        cssClass="text-slate-400 dark:text-slate-500"
                      />
                    </div>
                  } @else {
                    @if (formOpen()) {
                      <app-address-form
                        (saveAddress)="onSaveAddress($event)"
                        (cancel)="onCloseForm()"
                      />
                    } @else {
                      @if (checkoutStore.addresses().length === 0) {
                        <p
                          class="text-sm text-slate-500 dark:text-slate-400 mb-4"
                        >
                          {{ 'noAddresses' | translate }}
                        </p>
                      } @else {
                        <div class="flex flex-col gap-3">
                          @for (
                            address of checkoutStore.addresses();
                            track address.id
                          ) {
                            <button
                              type="button"
                              class="text-start rounded-card border p-4 transition-colors"
                              [class]="
                                selectedAddressId() === address.id
                                  ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-700/50'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                              "
                              (click)="selectedAddressId.set(address.id)"
                            >
                              <div class="flex items-center gap-2">
                                <p
                                  class="font-medium text-slate-900 dark:text-slate-100"
                                >
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
                              <p
                                class="text-sm text-slate-600 dark:text-slate-300 mt-1"
                              >
                                {{ address.province }} &middot;
                                {{ address.city }} &middot;
                                {{ address.fullAddress }}
                              </p>
                            </button>
                          }
                        </div>
                      }
                      <app-button
                        variant="ghost"
                        size="sm"
                        cssClass="mt-3"
                        (buttonClick)="onOpenForm()"
                      >
                        + {{ 'addNewAddress' | translate }}
                      </app-button>
                    }
                  }
                </app-card>
              }
              @case (1) {
                <app-card variant="bordered">
                  <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
                    {{ 'shippingMethod' | translate }}
                  </h2>
                  <div class="flex flex-col gap-3">
                    @for (option of shippingOptions; track option.method) {
                      <button
                        type="button"
                        class="flex items-center justify-between rounded-card border p-4 transition-colors"
                        [class]="
                          selectedShipping() === option.method
                            ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-700/50'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                        "
                        (click)="selectedShipping.set(option.method)"
                      >
                        <div>
                          <p
                            class="font-medium text-slate-900 dark:text-slate-100"
                          >
                            {{ option.labelKey | translate }}
                          </p>
                          <p
                            class="text-sm text-slate-500 dark:text-slate-400 mt-1"
                          >
                            {{
                              'estimatedDeliveryDays'
                                | translate: { days: option.etaDays }
                            }}
                          </p>
                        </div>
                        <p class="font-bold text-slate-900 dark:text-slate-100">
                          {{ option.price | localizedNumber }}
                          <span
                            class="text-xs font-normal text-slate-500 dark:text-slate-400"
                          >
                            {{ 'currencyToman' | translate }}
                          </span>
                        </p>
                      </button>
                    }
                  </div>
                </app-card>
              }
              @case (2) {
                <app-card variant="bordered">
                  <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
                    {{ 'paymentMethod' | translate }}
                  </h2>
                  <div
                    class="rounded-card border border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-700/50 p-4"
                  >
                    <p class="font-medium text-slate-900 dark:text-slate-100">
                      {{ 'cardToCard' | translate }}
                    </p>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {{ 'cardToCardInstructions' | translate }}
                    </p>
                  </div>
                </app-card>
              }
              @case (3) {
                <app-card variant="bordered">
                  <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
                    {{ 'reviewOrder' | translate }}
                  </h2>
                  <div class="flex flex-col gap-4">
                    <div>
                      <h3
                        class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2"
                      >
                        {{ 'items' | translate }}
                      </h3>
                      <ul class="flex flex-col gap-1">
                        @for (item of cartStore.items(); track item.id) {
                          <li
                            class="text-sm text-slate-700 dark:text-slate-300"
                          >
                            {{ item.productName }} ({{ item.size }}) ×
                            {{ item.quantity }} =
                            {{
                              item.quantity * Number(item.unitPrice)
                                | localizedNumber
                            }}
                            {{ 'currencyToman' | translate }}
                          </li>
                        }
                      </ul>
                    </div>
                    <div>
                      <h3
                        class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1"
                      >
                        {{ 'shippingAddress' | translate }}
                      </h3>
                      @if (selectedAddress(); as address) {
                        <p class="text-sm text-slate-700 dark:text-slate-300">
                          {{ address.province }} &middot;
                          {{ address.city }} &middot; {{ address.fullAddress }}
                        </p>
                      }
                    </div>
                    <div>
                      <h3
                        class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1"
                      >
                        {{ 'shippingMethod' | translate }}
                      </h3>
                      <p class="text-sm text-slate-700 dark:text-slate-300">
                        {{ selectedShippingOption()?.labelKey | translate }}
                      </p>
                    </div>
                    <div>
                      <h3
                        class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1"
                      >
                        {{ 'paymentMethod' | translate }}
                      </h3>
                      <p class="text-sm text-slate-700 dark:text-slate-300">
                        {{ 'cardToCard' | translate }}
                      </p>
                    </div>
                  </div>
                </app-card>
              }
            }

            <div class="flex items-center justify-between mt-6">
              @if (currentStep() > 0) {
                <app-button variant="ghost" (buttonClick)="onBack()">
                  {{ 'back' | translate }}
                </app-button>
              } @else {
                <span></span>
              }
              @if (currentStep() < 3) {
                <app-button
                  variant="primary"
                  [disabled]="!canContinue()"
                  (buttonClick)="onNext()"
                >
                  {{ 'continue' | translate }}
                </app-button>
              } @else {
                <app-button
                  variant="primary"
                  size="lg"
                  [loading]="checkoutStore.placing()"
                  [disabled]="!canContinue()"
                  (buttonClick)="onPlaceOrder()"
                >
                  {{ 'placeOrder' | translate }}
                </app-button>
              }
            </div>
          </div>

          <app-card variant="bordered" cssClass="h-fit lg:sticky lg:top-24">
            <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
              {{ 'orderSummary' | translate }}
            </h2>
            <div
              class="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-2"
            >
              <span>{{ 'subtotal' | translate }}</span>
              <span>
                {{ cartStore.totalPrice() | localizedNumber }}
                {{ 'currencyToman' | translate }}
              </span>
            </div>
            <div
              class="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-2"
            >
              <span>{{ 'shippingCost' | translate }}</span>
              <span>
                {{ selectedShippingOption()?.price ?? 0 | localizedNumber }}
                {{ 'currencyToman' | translate }}
              </span>
            </div>
            <div
              class="flex justify-between font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-3 mt-3"
            >
              <span>{{ 'grandTotal' | translate }}</span>
              <span>
                {{ grandTotal() | localizedNumber }}
                {{ 'currencyToman' | translate }}
              </span>
            </div>
          </app-card>
        </div>
      }
    </div>
  `,
})
export class CheckoutComponent {
  readonly cartStore = inject(CartStore);
  readonly checkoutStore = inject(CheckoutStore);

  readonly currentStep = signal(0);
  readonly selectedAddressId = signal<string | null>(null);
  readonly selectedShipping = signal<ShippingMethod | null>(null);
  readonly formOpen = signal(false);

  readonly stepLabels = [
    'shippingAddress',
    'shippingMethod',
    'paymentMethod',
    'reviewOrder',
  ] as const;

  readonly shippingOptions = SHIPPING_OPTIONS;

  readonly #router = inject(Router);

  readonly selectedAddress = computed<AddressModel | null>(
    () =>
      this.checkoutStore
        .addresses()
        .find((a) => a.id === this.selectedAddressId()) ?? null,
  );

  readonly selectedShippingOption = computed(
    () =>
      SHIPPING_OPTIONS.find((o) => o.method === this.selectedShipping()) ??
      null,
  );

  readonly grandTotal = computed(
    () =>
      this.cartStore.totalPrice() + (this.selectedShippingOption()?.price ?? 0),
  );

  constructor() {
    this.checkoutStore.loadAddresses();

    effect(() => {
      const addresses = this.checkoutStore.addresses();
      if (addresses.length === 0 || this.selectedAddressId() !== null) return;
      const defaultAddress = addresses.find((a) => a.isDefault);
      this.selectedAddressId.set((defaultAddress ?? addresses[0]).id);
    });
  }

  canContinue(): boolean {
    switch (this.currentStep()) {
      case 0:
        return this.selectedAddressId() !== null;
      case 1:
        return this.selectedShipping() !== null;
      default:
        return true;
    }
  }

  onNext() {
    if (!this.canContinue()) return;
    this.currentStep.update((step) => Math.min(step + 1, 3));
  }

  onBack() {
    this.currentStep.update((step) => Math.max(step - 1, 0));
  }

  onOpenForm() {
    this.formOpen.set(true);
  }

  onCloseForm() {
    this.formOpen.set(false);
  }

  onSaveAddress(payload: AddressPayloadModel) {
    this.checkoutStore.saveAddress(payload);
    this.onCloseForm();
  }

  onPlaceOrder() {
    const addressId = this.selectedAddressId();
    const method = this.selectedShipping();
    if (!addressId || !method) return;
    this.checkoutStore.placeOrder({
      shippingMethod: method,
      shippingAddressId: addressId,
      paymentMethod: PAYMENT_METHODS.CARD_TO_CARD,
    });
  }

  onStartShopping() {
    this.#router.navigate(['/products']);
  }
}
