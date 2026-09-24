import { computed, inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { OrderStatus } from '@domain/const/order-statuses';
import {
  injectCancelOrderMutation,
  injectUploadReceiptMutation,
  type UploadReceiptModel,
} from '../mutation/orders';
import { injectOrderQuery, injectOrdersQuery } from '../query/orders';

@Injectable()
export class OrderStore {
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly status = signal<OrderStatus | null>(null);
  readonly #id = signal(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly #ordersQuery = injectOrdersQuery(
    () => ({
      page: this.page(),
      pageSize: this.pageSize(),
      status: this.status() ?? undefined,
    }),
    () => !this.#id(),
  );
  readonly #orderQuery = injectOrderQuery(() => this.#id());

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

  readonly #receiptMutation = injectUploadReceiptMutation();
  readonly #cancelMutation = injectCancelOrderMutation();
  readonly saving = computed(
    () => this.#receiptMutation.isPending() || this.#cancelMutation.isPending(),
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

  uploadReceipt(value: UploadReceiptModel): void {
    this.#receiptMutation.mutate(value);
  }

  cancelOrder(id: string): void {
    this.#cancelMutation.mutate(id);
  }
}
