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
import { ORDER_STATUSES } from '@domain/const/order-statuses';
import { PAYMENT_METHODS } from '@domain/const/payment-methods';
import { PAYMENT_RESULTS } from '@domain/const/payment-results';
import { PAYMENT_STATUSES } from '@domain/const/payment-statuses';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import Image01Icon from '@hugeicons/core-free-icons/Image01Icon';

import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { SkeletonComponent } from '@shared/components/skeleton';
import { LocalizedDatePipe } from '@shared/pipes/localized-date';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { LanguageService } from '@shared/services/language';
import { ModalService } from '@shared/services/modal';
import { NotificationService } from '@shared/services/notification';
import { UploadService } from '../../../core/services/upload';
import { injectShopSettingsQuery } from '../../settings/query/settings';
import { OrderStatusBadgeComponent } from '../components/order-status-badge';
import { OrderStore } from '../store/order';

@Component({
  selector: 'app-order-detail',
  imports: [
    ButtonComponent,
    CardComponent,
    HugeiconsIconComponent,
    SkeletonComponent,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    OrderStatusBadgeComponent,
    TranslatePipe,
  ],
  providers: [OrderStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      @if (store.loading() && !store.order()) {
        <div class="flex flex-col gap-6" role="status" aria-live="polite">
          <span class="sr-only">{{ 'loading' | translate }}</span>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex flex-col gap-2">
              <app-skeleton cssClass="h-7 w-40" />
              <app-skeleton cssClass="h-4 w-28" />
            </div>
            <app-skeleton cssClass="h-6 w-24" />
          </div>
          <app-card variant="bordered">
            <div class="flex flex-col gap-4">
              @for (row of [1, 2, 3]; track row) {
                <div class="flex items-center gap-4">
                  <app-skeleton cssClass="h-16 w-16 rounded-lg shrink-0" />
                  <div class="flex flex-1 flex-col gap-2">
                    <app-skeleton cssClass="h-4 w-1/2" />
                    <app-skeleton cssClass="h-3 w-1/3" />
                  </div>
                </div>
              }
            </div>
          </app-card>
          <app-card variant="bordered">
            <app-skeleton cssClass="h-4 w-1/3" />
            <app-skeleton cssClass="mt-3 h-4 w-2/3" />
            <app-skeleton cssClass="mt-2 h-4 w-1/2" />
          </app-card>
        </div>
      } @else if (store.order(); as order) {
        <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
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

        <!-- Where the gateway sent the customer back to. The banner follows
             the order's real payment status, not just the query string, so a
             hand-edited URL can't claim a payment that didn't happen. -->
        @if (paymentBanner(); as banner) {
          <p
            role="status"
            class="mb-6 rounded-card border p-4 text-sm font-medium"
            [class]="
              banner === 'paymentSuccessBanner'
                ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            "
          >
            {{ banner | translate }}
          </p>
        }

        <!-- Online payment: pay (or pay again) until it is confirmed. -->
        @if (showOnlinePanel()) {
          <app-card variant="bordered" cssClass="mb-6">
            <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-1">
              {{ 'onlinePayment' | translate }}
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {{ 'onlinePaymentInstructions' | translate }}
            </p>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <span class="font-bold text-slate-900 dark:text-slate-100">
                {{ toNumber(order.totalAmount) | localizedNumber }}
                {{ 'currencyToman' | translate }}
              </span>
              <app-button
                variant="primary"
                [loading]="store.startingPayment()"
                (buttonClick)="onPay(order.id)"
              >
                {{
                  order.paymentStatus === failedStatus
                    ? ('payAgain' | translate)
                    : ('payNow' | translate)
                }}
              </app-button>
            </div>
          </app-card>
        }

        @if (order.paymentRefId; as refId) {
          <p class="mb-6 text-sm text-slate-600 dark:text-slate-300">
            {{ 'paymentRefId' | translate }}:
            <span class="font-mono" dir="ltr">{{ refId }}</span>
          </p>
        }

        <!-- Card-to-card instructions, shown until the payment is confirmed. -->
        @if (showPaymentPanel()) {
          <app-card variant="bordered" cssClass="mb-6">
            <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-1">
              {{ 'bankCardInfo' | translate }}
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {{ 'cardToCardInstructions' | translate }}
            </p>

            <div
              class="flex flex-col gap-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 p-4"
            >
              <!-- Card details come from shop settings, so they wait on it. -->
              @if (bankCard(); as card) {
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-500 dark:text-slate-400">
                    {{ 'cardNumber' | translate }}
                  </span>
                  <span
                    class="font-mono text-sm font-medium text-slate-900 dark:text-slate-100"
                    dir="ltr"
                  >
                    {{ card.bankCardNumber }}
                  </span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-500 dark:text-slate-400">
                    {{ 'cardHolder' | translate }}
                  </span>
                  <span
                    class="text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    {{ card.bankCardHolder }}
                  </span>
                </div>
              }
              <div
                class="flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700 pt-3"
              >
                <span class="text-sm text-slate-500 dark:text-slate-400">
                  {{ 'transferAmount' | translate }}
                </span>
                <span class="font-bold text-slate-900 dark:text-slate-100">
                  {{ toNumber(order.totalAmount) | localizedNumber }}
                  {{ 'currencyToman' | translate }}
                </span>
              </div>
            </div>

            @if (order.paymentReceipt; as receipt) {
              <div class="mt-4">
                <p
                  class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2"
                >
                  {{ 'receiptUploaded' | translate }}
                </p>
                <img
                  loading="lazy"
                  [src]="receipt"
                  [alt]="'uploadReceipt' | translate"
                  class="max-h-64 rounded-lg border border-slate-200 dark:border-slate-700 object-contain"
                />
              </div>
            }

            <div class="mt-4">
              <input
                #receiptInput
                type="file"
                accept="image/*"
                class="hidden"
                (change)="onReceiptSelected($event)"
              />
              <app-button
                variant="primary"
                [loading]="uploading() || store.saving()"
                (buttonClick)="receiptInput.click()"
              >
                {{
                  order.paymentReceipt
                    ? ('replaceReceipt' | translate)
                    : ('uploadReceipt' | translate)
                }}
              </app-button>
            </div>
          </app-card>
        }

        <app-card variant="bordered" cssClass="mb-6">
          <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
            {{ 'products' | translate }}
          </h2>
          <div class="flex flex-col gap-4">
            @for (item of order.items; track item.id) {
              <div class="flex items-center gap-4">
                @if (item.productImage; as image) {
                  <img
                    loading="lazy"
                    [src]="image"
                    [alt]="item.productName"
                    class="w-16 h-16 rounded-lg object-cover bg-slate-100 dark:bg-slate-700"
                  />
                } @else {
                  <div
                    class="flex w-16 h-16 rounded-lg items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                  >
                    <hugeicons-icon
                      [icon]="icons.Image01Icon"
                      [size]="24"
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
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
          <!-- Shipping was snapshotted at order time, so the breakdown is
               read off the order rather than recomputed from settings. -->
          <div
            class="flex justify-between text-sm text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4"
          >
            <span>{{ 'subtotal' | translate }}</span>
            <span>
              {{ itemsSubtotal(order) | localizedNumber }}
              {{ 'currencyToman' | translate }}
            </span>
          </div>
          <div
            class="flex justify-between text-sm text-slate-600 dark:text-slate-300 mt-2"
          >
            <span>{{ 'shippingCost' | translate }}</span>
            <span>
              {{ toNumber(order.shippingAmount) | localizedNumber }}
              {{ 'currencyToman' | translate }}
            </span>
          </div>
          <div
            class="flex justify-between font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-3 mt-3"
          >
            <span>{{ 'grandTotal' | translate }}</span>
            <span>
              {{ toNumber(order.totalAmount) | localizedNumber }}
              {{ 'currencyToman' | translate }}
            </span>
          </div>
        </app-card>

        <app-card variant="bordered" cssClass="mb-6">
          <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
            {{ 'shippingAddress' | translate }}
          </h2>
          <p class="text-sm text-slate-900 dark:text-slate-100 font-medium">
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
          <div
            class="flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-200 dark:border-slate-700 pt-3 mt-3 text-sm text-slate-600 dark:text-slate-300"
          >
            <span>
              {{ 'shippingMethod' | translate }}:
              {{ shippingMethodKey(order.shippingMethod) | translate }}
            </span>
            @if (order.trackingCode; as trackingCode) {
              <span>
                {{ 'trackingCode' | translate }}: {{ trackingCode }}
              </span>
            }
          </div>
        </app-card>

        <div class="flex flex-wrap gap-3">
          <app-button variant="secondary" (buttonClick)="onBack()">
            {{ 'orderHistory' | translate }}
          </app-button>
          @if (canCancel()) {
            <app-button
              variant="secondary"
              cssClass="!text-red-600 dark:!text-red-400"
              [loading]="store.saving()"
              (buttonClick)="onCancel(order.id)"
            >
              {{ 'cancelOrder' | translate }}
            </app-button>
          }
        </div>
      } @else {
        <div
          class="flex flex-col items-center gap-4 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center"
        >
          <p class="text-lg font-medium text-slate-900 dark:text-slate-100">
            {{ 'orderNotFound' | translate }}
          </p>
          <app-button variant="primary" (buttonClick)="onBack()">
            {{ 'orderHistory' | translate }}
          </app-button>
        </div>
      }
    </div>
  `,
})
export class OrderDetailComponent implements OnInit {
  /** Bound from the route via `withComponentInputBinding`. */
  readonly id = input.required<string>();
  /** `?payment=SUCCESS|FAILED`, appended by the backend after the gateway. */
  readonly payment = input<string>();

  readonly failedStatus = PAYMENT_STATUSES.FAILED;

  readonly store = inject(OrderStore);

  readonly icons = { Image01Icon };

  /**
   * The destination card comes from shop settings rather than a const, so the
   * admin can change it without a deploy. The panel is only rendered once the
   * row has loaded.
   */
  readonly #settingsQuery = injectShopSettingsQuery();
  readonly bankCard = computed(() => this.#settingsQuery.data() ?? null);

  readonly uploading = signal(false);

  readonly #router = inject(Router);
  readonly #upload = inject(UploadService);
  readonly #modal = inject(ModalService);
  readonly #notification = inject(NotificationService);
  readonly #language = inject(LanguageService);

  readonly showPaymentPanel = computed(() => {
    const order = this.store.order();
    if (!order) return false;
    return (
      order.paymentMethod === PAYMENT_METHODS.CARD_TO_CARD &&
      order.paymentStatus !== PAYMENT_STATUSES.PAID &&
      order.status !== ORDER_STATUSES.CANCELLED
    );
  });

  readonly showOnlinePanel = computed(() => {
    const order = this.store.order();
    if (!order) return false;
    return (
      order.paymentMethod === PAYMENT_METHODS.ONLINE &&
      order.paymentStatus !== PAYMENT_STATUSES.PAID &&
      order.status !== ORDER_STATUSES.CANCELLED
    );
  });

  /** Translation key of the result banner, or null when there is nothing to say. */
  readonly paymentBanner = computed(() => {
    const order = this.store.order();
    const result = this.payment();
    if (!order || order.paymentMethod !== PAYMENT_METHODS.ONLINE) return null;
    if (order.paymentStatus === PAYMENT_STATUSES.PAID) {
      return result === PAYMENT_RESULTS.SUCCESS ? 'paymentSuccessBanner' : null;
    }
    return result === PAYMENT_RESULTS.FAILED ? 'paymentFailedBanner' : null;
  });

  readonly canCancel = computed(() => {
    const status = this.store.order()?.status;
    return status === 'PENDING' || status === 'CONFIRMED';
  });

  ngOnInit() {
    this.store.loadOrder(this.id());
  }

  toNumber(value: string): number {
    return Number(value);
  }

  /**
   * Items total, derived by backing the snapshotted shipping charge out of the
   * order total — the API sends the two amounts, not a separate subtotal.
   */
  itemsSubtotal(order: {
    totalAmount: string;
    shippingAmount: string;
  }): number {
    return Number(order.totalAmount) - Number(order.shippingAmount);
  }

  shortId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  shippingMethodKey(method: string): string {
    return method === 'POST' ? 'post' : 'courier';
  }

  onReceiptSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;
    // Clear immediately so re-picking the same file still fires a change.
    fileInput.value = '';

    this.uploading.set(true);
    this.#upload.upload(file).subscribe({
      next: (response) => {
        this.uploading.set(false);
        this.store.uploadReceipt({
          id: this.id(),
          paymentReceipt: response.url,
        });
      },
      error: () => {
        this.uploading.set(false);
        this.#notification.show(
          'error',
          this.#language.translate('couldNotSave'),
        );
      },
    });
  }

  onPay(id: string) {
    this.store.startPayment(id);
  }

  onCancel(id: string) {
    void this.#modal
      .open({
        title: 'cancelOrder',
        description: 'confirmCancelOrder',
        confirmLabel: 'confirm',
        cancelLabel: 'cancel',
      })
      .then((confirmed) => {
        if (confirmed) this.store.cancelOrder(id);
      });
  }

  onBack() {
    void this.#router.navigate(['/orders']);
  }
}
