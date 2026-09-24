import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import type { AddressPayloadModel } from '@domain/models/address';
import type { CreateOrderPayloadModel } from '@domain/models/order';
import { injectSaveAddressMutation } from '../../addresses/mutation/addresses';
import { injectAddressesQuery } from '../../addresses/query/addresses';
import { CartStore } from '../../cart/store/cart';
import { injectCreateOrderMutation } from '../mutation/orders';

@Injectable()
export class CheckoutStore {
  readonly #cartStore = inject(CartStore);
  readonly #router = inject(Router);

  // Same query as the addresses feature, so the list is already warm if the
  // user visited /addresses first.
  readonly #addressesQuery = injectAddressesQuery();
  readonly addresses = computed(() => this.#addressesQuery.data() ?? []);
  readonly loadingAddresses = computed(() => this.#addressesQuery.isPending());

  // Checkout adds an address inline; the page's own flow reports success.
  readonly #saveAddressMutation = injectSaveAddressMutation({ notify: false });
  readonly #placeOrderMutation = injectCreateOrderMutation({
    onSuccess: (order) => {
      this.#cartStore.clearLocal();
      void this.#router.navigate(['/orders', order.id]);
    },
  });
  readonly placing = computed(() => this.#placeOrderMutation.isPending());

  loadAddresses(): void {
    if (!this.#addressesQuery.isFetching() && !this.#addressesQuery.data()) {
      void this.#addressesQuery.refetch();
    }
  }

  saveAddress(payload: AddressPayloadModel): void {
    this.#saveAddressMutation.mutate({ payload });
  }

  placeOrder(payload: CreateOrderPayloadModel): void {
    this.#placeOrderMutation.mutate(payload);
  }
}
