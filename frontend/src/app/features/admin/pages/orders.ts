import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ORDER_STATUSES, type OrderStatus } from '@domain/const/order-statuses';
import {
  PAYMENT_STATUSES,
  type PaymentStatus,
} from '@domain/const/payment-statuses';
import type { AdminOrderModel } from '@domain/models/order';
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
import {
  ORDER_STATUS_KEYS,
  OrderStatusBadgeComponent,
  PAYMENT_STATUS_KEYS,
} from '../../orders/components/order-status-badge';
import { AdminOrderStore } from '../store/order';

@Component({
  selector: 'app-admin-orders',
  imports: [
    ButtonComponent,
    CardComponent,
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
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {{ 'manageOrders' | translate }}
      </h1>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <app-input
          [placeholder]="'searchOrders' | translate"
          (inputChange)="onSearchInput($event)"
          (inputBlur)="onSearchApply()"
          (inputKeydown)="onSearchKeydown($event)"
        />
        <app-select
          [options]="statusOptions()"
          [placeholder]="'orderStatus' | translate"
          (selectChange)="onStatusChange($event)"
        />
        <app-select
          [options]="paymentStatusOptions()"
          [placeholder]="'paymentStatus' | translate"
          (selectChange)="onPaymentStatusChange($event)"
        />
      </div>

      @if (store.loading()) {
        <div class="flex justify-center py-16">
          <app-loading-spinner
            size="lg"
            cssClass="text-slate-400 dark:text-slate-500"
          />
        </div>
      } @else {
        <app-card variant="bordered" padding="none">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr
                  class="border-b border-slate-200 dark:border-slate-700 text-start text-slate-500 dark:text-slate-400"
                >
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'orderNumber' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'customer' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'orderDate' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'total' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'orderStatus' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'paymentStatus' | translate }}
                  </th>
                  <th class="px-4 py-3 text-end font-medium">
                    {{ 'actions' | translate }}
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (order of store.orders(); track order.id) {
                  <tr
                    class="border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <td
                      class="px-4 py-3 font-mono text-xs font-medium text-slate-900 dark:text-slate-100"
                    >
                      {{ shortId(order.id) }}
                    </td>
                    <td class="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {{ order.customer.firstName }}
                      {{ order.customer.lastName }}
                      <span
                        class="block text-xs text-slate-500 dark:text-slate-400"
                      >
                        {{ order.customer.phone }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {{ order.createdAt | localizedDate }}
                    </td>
                    <td
                      class="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap"
                    >
                      {{ toNumber(order.totalAmount) | localizedNumber }}
                      {{ 'currencyToman' | translate }}
                    </td>
                    <td class="px-4 py-3">
                      <app-order-status-badge [status]="order.status" />
                    </td>
                    <td class="px-4 py-3">
                      <app-order-status-badge
                        [paymentStatus]="order.paymentStatus"
                      />
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex justify-end">
                        <app-button
                          variant="secondary"
                          (buttonClick)="onView(order)"
                        >
                          {{ 'viewDetails' | translate }}
                        </app-button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td
                      colspan="7"
                      class="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      {{ 'noOrders' | translate }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-card>

        @if (store.totalPages() > 1) {
          <div class="flex items-center justify-center gap-4">
            <app-button
              variant="secondary"
              [disabled]="store.page() <= 1"
              (buttonClick)="onPageChange(store.page() - 1)"
            >
              {{ 'previous' | translate }}
            </app-button>
            <span class="text-sm text-slate-500 dark:text-slate-400">
              {{
                'pageOf'
                  | translate
                    : { page: store.page(), totalPages: store.totalPages() }
              }}
            </span>
            <app-button
              variant="secondary"
              [disabled]="store.page() >= store.totalPages()"
              (buttonClick)="onPageChange(store.page() + 1)"
            >
              {{ 'next' | translate }}
            </app-button>
          </div>
        }
      }
    </div>
  `,
})
export class AdminOrdersComponent {
  readonly store = inject(AdminOrderStore);

  readonly #router = inject(Router);
  readonly #language = inject(LanguageService);
  #searchInput = '';

  // Methods, not fields, so labels re-translate when the language changes.
  readonly statusOptions = (): SelectOption[] =>
    Object.values(ORDER_STATUSES).map((status) => ({
      value: status,
      label: this.#language.translate(ORDER_STATUS_KEYS[status]),
    }));

  readonly paymentStatusOptions = (): SelectOption[] =>
    Object.values(PAYMENT_STATUSES).map((status) => ({
      value: status,
      label: this.#language.translate(PAYMENT_STATUS_KEYS[status]),
    }));

  toNumber(value: string): number {
    return Number(value);
  }

  shortId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  onSearchInput(value: string) {
    this.#searchInput = value;
  }

  onSearchApply() {
    this.store.setSearch(this.#searchInput);
  }

  onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.onSearchApply();
  }

  onStatusChange(value: string | number | null) {
    this.store.setStatus((value as OrderStatus | null) ?? null);
  }

  onPaymentStatusChange(value: string | number | null) {
    this.store.setPaymentStatus((value as PaymentStatus | null) ?? null);
  }

  onView(order: AdminOrderModel) {
    this.#router.navigate(['/admin/orders', order.id]);
  }

  onPageChange(page: number) {
    this.store.setPage(page);
  }
}
