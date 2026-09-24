import { computed, inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { OrderStatus } from '@domain/const/order-statuses';
import type { PaymentStatus } from '@domain/const/payment-statuses';
import {
  injectUpdateOrderStatusMutation,
  injectUpdatePaymentStatusMutation,
  type UpdateOrderStatusModel,
  type UpdatePaymentStatusModel,
} from '../mutation/admin-orders';
import {
  injectAdminOrderQuery,
  injectAdminOrdersQuery,
} from '../query/admin-orders';

@Injectable()
export class AdminOrderStore {
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly status = signal<OrderStatus | null>(null);
  readonly paymentStatus = signal<PaymentStatus | null>(null);
  readonly search = signal('');
  readonly #id = signal(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly #ordersQuery = injectAdminOrdersQuery(
    () => ({
      page: this.page(),
      pageSize: this.pageSize(),
      status: this.status() ?? undefined,
      paymentStatus: this.paymentStatus() ?? undefined,
      search: this.search() || undefined,
    }),
    () => !this.#id(),
  );
  readonly #orderQuery = injectAdminOrderQuery(() => this.#id());

  readonly orders = computed(() => this.#ordersQuery.data()?.items ?? []);
  readonly order = computed(() => this.#orderQuery.data() ?? null);
  readonly total = computed(() => this.#ordersQuery.data()?.total ?? 0);
  readonly totalPages = computed(
    () => this.#ordersQuery.data()?.totalPages ?? 0,
  );
  readonly loading = computed(() =>
    this.#id() ? this.#orderQuery.isPending() : this.#ordersQuery.isPending(),
  );
  readonly error = computed(() =>
    this.#id() ? this.#orderQuery.error() : this.#ordersQuery.error(),
  );

  readonly #statusMutation = injectUpdateOrderStatusMutation();
  readonly #paymentMutation = injectUpdatePaymentStatusMutation();
  readonly saving = computed(
    () => this.#statusMutation.isPending() || this.#paymentMutation.isPending(),
  );

  loadOrder(id: string): void {
    this.#id.set(id);
  }

  setPage(page: number): void {
    this.page.set(page);
  }

  setStatus(status: OrderStatus | null): void {
    this.status.set(status);
    this.page.set(1);
  }

  setPaymentStatus(paymentStatus: PaymentStatus | null): void {
    this.paymentStatus.set(paymentStatus);
    this.page.set(1);
  }

  setSearch(search: string): void {
    this.search.set(search);
    this.page.set(1);
  }

  updateStatus(value: UpdateOrderStatusModel): void {
    this.#statusMutation.mutate(value);
  }

  updatePaymentStatus(value: UpdatePaymentStatusModel): void {
    this.#paymentMutation.mutate(value);
  }
}
