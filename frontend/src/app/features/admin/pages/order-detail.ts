import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Image01Icon } from '@hugeicons/core-free-icons';
import type { OrderStatus } from '@domain/const/order-statuses';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { InputComponent } from '@shared/components/input';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { SelectComponent } from '@shared/components/select';
import type { SelectOption } from '@shared/models/select';
import { LocalizedDatePipe } from '@shared/pipes/localized-date';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { LanguageService } from '@shared/services/language';
import { ModalService } from '@shared/services/modal';
import {
  ORDER_STATUS_KEYS,
  OrderStatusBadgeComponent,
} from '../../orders/components/order-status-badge';
import { AdminOrderStore } from '../store/order';

/**
 * Mirrors the backend's STATUS_TRANSITIONS (orders.service.ts) so the UI only
 * offers moves the API will accept.
 */
const NEXT_STATUSES: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

@Component({
  selector: 'app-admin-order-detail',
  imports: [
    ButtonComponent,
    CardComponent,
    HugeiconsIconComponent,
    InputComponent,
    LoadingSpinnerComponent,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    OrderStatusBadgeComponent,
    SelectComponent,
    TranslatePipe,
  ],
  providers: [AdminOrderStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col gap-6">
      @if (store.loading() && !store.order()) {
        <div class="flex justify-center py-16">
          <app-loading-spinner
            size="lg"
            cssClass="text-slate-400 dark:text-slate-500"
          />
        </div>
      } @else if (store.order(); as order) {
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ 'orderDetail' | translate }}
            </h1>
            <p
              class="font-mono text-sm text-slate-500 dark:text-slate-400 mt-1"
            >
              {{ shortId(order.id) }}
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {{ order.createdAt | localizedDate }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <app-order-status-badge [status]="order.status" />
            <app-order-status-badge [paymentStatus]="order.paymentStatus" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div class="lg:col-span-2 flex flex-col gap-6">
            <app-card variant="bordered">
              <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
                {{ 'products' | translate }}
              </h2>
              <div class="flex flex-col gap-4">
                @for (item of order.items; track item.id) {
                  <div class="flex items-center gap-4">
                    @if (item.productImage; as image) {
                      <img
                        [src]="image"
                        [alt]="item.productName"
                        class="w-14 h-14 rounded-lg object-cover bg-slate-100 dark:bg-slate-700"
                      />
                    } @else {
                      <div
                        class="flex w-14 h-14 rounded-lg items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                      >
                        <hugeicons-icon
                          [icon]="icons.Image01Icon"
                          [size]="22"
                          color="currentColor"
                          [strokeWidth]="1.5"
                        />
                      </div>
                    }
                    <div class="flex-1 min-w-0">
                      <p
                        class="font-medium text-slate-900 dark:text-slate-100 truncate"
                      >
                        {{ item.productName }}
                      </p>
                      <p
                        class="text-sm text-slate-500 dark:text-slate-400 mt-1"
                      >
                        {{ 'size' | translate }}: {{ item.size }} ·
                        {{ 'quantity' | translate }}:
                        {{ item.quantity | localizedNumber }}
                      </p>
                    </div>
                    <p
                      class="font-medium text-slate-900 dark:text-slate-100 shrink-0"
                    >
                      {{ toNumber(item.totalPrice) | localizedNumber }}
                      {{ 'currencyToman' | translate }}
                    </p>
                  </div>
                }
              </div>
              <div
                class="flex justify-between font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4"
              >
                <span>{{ 'grandTotal' | translate }}</span>
                <span>
                  {{ toNumber(order.totalAmount) | localizedNumber }}
                  {{ 'currencyToman' | translate }}
                </span>
              </div>
            </app-card>

            <app-card variant="bordered">
              <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
                {{ 'shippingAddress' | translate }}
              </h2>
              <p class="text-sm font-medium text-slate-900 dark:text-slate-100">
                {{ order.shippingAddress.label }}
              </p>
              <p class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {{ order.shippingAddress.province }},
                {{ order.shippingAddress.city }}
              </p>
              <p class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {{ order.shippingAddress.fullAddress }}
              </p>
              @if (order.shippingAddress.postalCode; as postalCode) {
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {{ 'postalCode' | translate }}: {{ postalCode }}
                </p>
              }
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {{ 'phone' | translate }}: {{ order.shippingAddress.phone }}
              </p>
              @if (order.notes; as notes) {
                <div
                  class="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3"
                >
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    {{ 'notes' | translate }}
                  </p>
                  <p class="text-sm text-slate-900 dark:text-slate-100 mt-1">
                    {{ notes }}
                  </p>
                </div>
              }
            </app-card>

            <!-- Receipt review: the admin's evidence for confirming payment. -->
            <app-card variant="bordered">
              <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
                {{ 'paymentReceipt' | translate }}
              </h2>
              @if (order.paymentReceipt; as receipt) {
                <img
                  [src]="receipt"
                  [alt]="'paymentReceipt' | translate"
                  class="max-h-96 rounded-lg border border-slate-200 dark:border-slate-700 object-contain"
                />
                @if (order.paymentStatus !== 'PAID') {
                  <div class="flex flex-wrap gap-3 mt-4">
                    <app-button
                      variant="primary"
                      [loading]="store.saving()"
                      (buttonClick)="onConfirmPayment(order.id)"
                    >
                      {{ 'confirmPayment' | translate }}
                    </app-button>
                    <app-button
                      variant="secondary"
                      cssClass="!text-red-600 dark:!text-red-400"
                      [loading]="store.saving()"
                      (buttonClick)="onRejectPayment(order.id)"
                    >
                      {{ 'rejectPayment' | translate }}
                    </app-button>
                  </div>
                }
              } @else {
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  {{ 'noReceiptUploaded' | translate }}
                </p>
                @if (order.paymentStatus !== 'PAID') {
                  <app-button
                    variant="secondary"
                    cssClass="mt-4"
                    [loading]="store.saving()"
                    (buttonClick)="onConfirmPayment(order.id)"
                  >
                    {{ 'markAsPaid' | translate }}
                  </app-button>
                }
              }
            </app-card>
          </div>

          <div class="flex flex-col gap-6">
            <app-card variant="bordered">
              <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
                {{ 'customer' | translate }}
              </h2>
              <p class="text-sm font-medium text-slate-900 dark:text-slate-100">
                {{ order.customer.firstName }} {{ order.customer.lastName }}
              </p>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {{ order.customer.phone }}
              </p>
            </app-card>

            <app-card variant="bordered">
              <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
                {{ 'orderStatus' | translate }}
              </h2>
              @if (nextStatusOptions().length > 0) {
                <div class="flex flex-col gap-3">
                  <app-select
                    [options]="nextStatusOptions()"
                    [placeholder]="'changeStatus' | translate"
                    (selectChange)="onStatusSelected($event)"
                  />
                  @if (selectedStatus() === 'SHIPPED') {
                    <app-input
                      [label]="'trackingCode' | translate"
                      [placeholder]="'trackingCode' | translate"
                      (inputChange)="onTrackingCodeInput($event)"
                    />
                  }
                  <app-button
                    variant="primary"
                    [disabled]="!selectedStatus()"
                    [loading]="store.saving()"
                    (buttonClick)="onApplyStatus(order.id)"
                  >
                    {{ 'save' | translate }}
                  </app-button>
                </div>
              } @else {
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  {{ 'noFurtherStatusChanges' | translate }}
                </p>
              }

              @if (order.trackingCode; as trackingCode) {
                <div
                  class="border-t border-slate-200 dark:border-slate-700 pt-3 mt-4"
                >
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    {{ 'trackingCode' | translate }}
                  </p>
                  <p
                    class="font-mono text-sm text-slate-900 dark:text-slate-100 mt-1"
                  >
                    {{ trackingCode }}
                  </p>
                </div>
              }
            </app-card>

            <app-button variant="secondary" (buttonClick)="onBack()">
              {{ 'manageOrders' | translate }}
            </app-button>
          </div>
        </div>
      } @else {
        <div
          class="flex flex-col items-center gap-4 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center"
        >
          <p class="text-lg font-medium text-slate-900 dark:text-slate-100">
            {{ 'orderNotFound' | translate }}
          </p>
          <app-button variant="primary" (buttonClick)="onBack()">
            {{ 'manageOrders' | translate }}
          </app-button>
        </div>
      }
    </div>
  `,
})
export class AdminOrderDetailComponent implements OnInit {
  /** Bound from the route via `withComponentInputBinding`. */
  readonly id = input.required<string>();

  readonly store = inject(AdminOrderStore);

  readonly icons = { Image01Icon };

  readonly selectedStatus = signal<OrderStatus | null>(null);

  readonly #router = inject(Router);
  readonly #modal = inject(ModalService);
  readonly #language = inject(LanguageService);
  #trackingCode = '';

  readonly nextStatusOptions = computed<SelectOption[]>(() => {
    const status = this.store.order()?.status;
    if (!status) return [];
    return NEXT_STATUSES[status].map((next) => ({
      value: next,
      label: this.#language.translate(ORDER_STATUS_KEYS[next]),
    }));
  });

  ngOnInit() {
    this.store.loadOrder(this.id());
  }

  toNumber(value: string): number {
    return Number(value);
  }

  shortId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  onStatusSelected(value: string | number | null) {
    this.selectedStatus.set((value as OrderStatus | null) ?? null);
  }

  onTrackingCodeInput(value: string) {
    this.#trackingCode = value;
  }

  onApplyStatus(id: string) {
    const status = this.selectedStatus();
    if (!status) return;

    const apply = () => {
      this.store.updateStatus({
        id,
        status,
        trackingCode: this.#trackingCode.trim() || undefined,
      });
      this.selectedStatus.set(null);
      this.#trackingCode = '';
    };

    // Cancelling restores stock and cannot be undone, so confirm it.
    if (status === 'CANCELLED') {
      this.#modal
        .open({
          title: 'cancelOrder',
          description: 'confirmCancelOrderAdmin',
          confirmLabel: 'confirm',
          cancelLabel: 'cancel',
        })
        .then((confirmed) => {
          if (confirmed) apply();
        });
      return;
    }
    apply();
  }

  onConfirmPayment(id: string) {
    this.store.updatePaymentStatus({ id, paymentStatus: 'PAID' });
  }

  onRejectPayment(id: string) {
    this.store.updatePaymentStatus({ id, paymentStatus: 'FAILED' });
  }

  onBack() {
    this.#router.navigate(['/admin/orders']);
  }
}
