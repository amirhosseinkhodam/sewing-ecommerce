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
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { LocalizedDatePipe } from '@shared/pipes/localized-date';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { LanguageService } from '@shared/services/language';
import { ModalService } from '@shared/services/modal';
import { NotificationService } from '@shared/services/notification';
import { UploadService } from '../../../core/services/upload';
import { BANK_CARD } from '../const/bank-card';
import { OrderStatusBadgeComponent } from '../components/order-status-badge';
import { OrderStore } from '../store/order';

@Component({
  selector: 'app-order-detail',
  imports: [
    ButtonComponent,
    CardComponent,
    HugeiconsIconComponent,
    LoadingSpinnerComponent,
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
        <div class="flex justify-center py-20">
          <app-loading-spinner
            size="lg"
            cssClass="text-slate-400 dark:text-slate-500"
          />
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
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-slate-500 dark:text-slate-400">
                  {{ 'cardNumber' | translate }}
                </span>
                <span
                  class="font-mono text-sm font-medium text-slate-900 dark:text-slate-100"
                  dir="ltr"
                >
                  {{ bankCard.cardNumber }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-slate-500 dark:text-slate-400">
                  {{ 'cardHolder' | translate }}
                </span>
                <span
                  class="text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  {{ bankCard.cardHolder }}
                </span>
              </div>
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

  readonly store = inject(OrderStore);

  readonly icons = { Image01Icon };
  readonly bankCard = BANK_CARD;

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
      order.paymentMethod === 'CARD_TO_CARD' &&
      order.paymentStatus !== 'PAID' &&
      order.status !== 'CANCELLED'
    );
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

  onCancel(id: string) {
    this.#modal
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
    this.#router.navigate(['/orders']);
  }
}
