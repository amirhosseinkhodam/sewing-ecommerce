import { computed, inject, Injectable } from '@angular/core';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AuthStore } from '@auth/store/auth';
import type { AddCartItemPayloadModel, CartModel } from '@domain/models/cart';
import { QUERY_KEYS } from '@shared/const/query-keys';
import {
  injectAddCartItemMutation,
  injectRemoveCartItemMutation,
  injectUpdateCartItemMutation,
  type UpdateCartItemModel,
} from '../mutation/cart';
import { injectCartQuery } from '../query/cart';

@Injectable({ providedIn: 'root' })
export class CartStore {
  readonly #auth = inject(AuthStore);
  readonly #queryClient = inject(QueryClient);

  readonly #cartQuery = injectCartQuery(() => this.#auth.isLoggedIn());
  readonly cart = computed(() => this.#cartQuery.data() ?? null);
  readonly items = computed(() => this.cart()?.items ?? []);
  readonly totalItems = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0),
  );
  readonly totalPrice = computed(() =>
    this.items().reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    ),
  );
  readonly loading = computed(
    () => this.#auth.isLoggedIn() && this.#cartQuery.isPending(),
  );

  readonly #addMutation = injectAddCartItemMutation();
  readonly #updateMutation = injectUpdateCartItemMutation();
  readonly #removeMutation = injectRemoveCartItemMutation();

  load(): void {
    if (
      this.#auth.isLoggedIn() &&
      !this.#cartQuery.data() &&
      !this.#cartQuery.isFetching()
    ) {
      void this.#cartQuery.refetch();
    }
  }

  addItem(payload: AddCartItemPayloadModel): void {
    this.#addMutation.mutate(payload);
  }

  updateQuantity(value: UpdateCartItemModel): void {
    this.#updateMutation.mutate(value);
  }

  removeItem(itemId: string): void {
    this.#removeMutation.mutate(itemId);
  }

  /** Clears the cached cart after checkout, without a server round trip. */
  clearLocal(): void {
    this.#queryClient.setQueryData<CartModel | null>([QUERY_KEYS.cart], null);
  }
}
