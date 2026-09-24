import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { OrderStatus } from '@domain/const/order-statuses';
import type { PaymentStatus } from '@domain/const/payment-statuses';
import { TranslatePipe } from '@shared/pipes/translate';

const ORDER_STATUS_CLASSES: Readonly<Record<OrderStatus, string>> = {
  PENDING:
    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  CONFIRMED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  PROCESSING:
    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  SHIPPED: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  DELIVERED:
    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const PAYMENT_STATUS_CLASSES: Readonly<Record<PaymentStatus, string>> = {
  PENDING:
    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  PAID: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  FAILED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  REFUNDED: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
};

/** i18n keys follow PLAN.md §10: `statusPending`, `paymentPaid`, and so on. */
export const ORDER_STATUS_KEYS: Readonly<Record<OrderStatus, string>> = {
  PENDING: 'statusPending',
  CONFIRMED: 'statusConfirmed',
  PROCESSING: 'statusProcessing',
  SHIPPED: 'statusShipped',
  DELIVERED: 'statusDelivered',
  CANCELLED: 'statusCancelled',
};

export const PAYMENT_STATUS_KEYS: Readonly<Record<PaymentStatus, string>> = {
  PENDING: 'paymentPending',
  PAID: 'paymentPaid',
  FAILED: 'paymentFailed',
  REFUNDED: 'paymentRefunded',
};

@Component({
  selector: 'app-order-status-badge',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <span
      class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      [class]="badgeClass()"
    >
      {{ labelKey() | translate }}
    </span>
  `,
})
export class OrderStatusBadgeComponent {
  readonly status = input<OrderStatus | null>(null);
  readonly paymentStatus = input<PaymentStatus | null>(null);

  readonly badgeClass = computed(() => {
    const order = this.status();
    if (order) return ORDER_STATUS_CLASSES[order];
    const payment = this.paymentStatus();
    return payment ? PAYMENT_STATUS_CLASSES[payment] : '';
  });

  readonly labelKey = computed(() => {
    const order = this.status();
    if (order) return ORDER_STATUS_KEYS[order];
    const payment = this.paymentStatus();
    return payment ? PAYMENT_STATUS_KEYS[payment] : '';
  });
}
