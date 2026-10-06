import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PAYMENT_METHODS } from '@domain/const/payment-methods';
import type { AddressPayloadModel } from '@domain/models/address';
import type { CreateOrderPayloadModel } from '@domain/models/order';
import { injectSaveAddressMutation } from '../../addresses/mutation/addresses';
import { injectAddressesQuery } from '../../addresses/query/addresses';
import { CartStore } from '../../cart/store/cart';
import { injectCreateOrderMutation } from '../mutation/orders';
import { injectStartPaymentMutation } from '../mutation/payment';
import { injectPaymentMethodsQuery } from '../query/payment';

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

  // Card-to-card is always available; online payment appears only when the
  // backend has a gateway configured.
  readonly #paymentMethodsQuery = injectPaymentMethodsQuery();
  readonly paymentMethods = computed(
    () =>
      this.#paymentMethodsQuery.data()?.methods ?? [
        PAYMENT_METHODS.CARD_TO_CARD,
      ],
  );

  // If the gateway can't be reached the order still exists, so land on its
  // page, where "Pay now" retries.
  #pendingOrderId: string | null = null;
  readonly #startPaymentMutation = injectStartPaymentMutation({
    onError: () => this.#openOrder(),
  });
  readonly #placeOrderMutation = injectCreateOrderMutation({
    onSuccess: (order) => {
      this.#cartStore.clearLocal();
      this.#pendingOrderId = order.id;
      if (order.paymentMethod === PAYMENT_METHODS.ONLINE) {
        this.#startPaymentMutation.mutate(order.id);
      } else {
        this.#openOrder();
      }
    },
  });
  readonly placing = computed(
    () =>
      this.#placeOrderMutation.isPending() ||
      this.#startPaymentMutation.isPending() ||
      this.#startPaymentMutation.isSuccess(),
  );

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

  #openOrder(): void {
    if (this.#pendingOrderId) {
      void this.#router.navigate(['/orders', this.#pendingOrderId]);
    }
  }
}
