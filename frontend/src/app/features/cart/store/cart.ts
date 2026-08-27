import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import type { AddCartItemPayloadModel, CartModel } from '@domain/models/cart';
import { NotificationService } from '@shared/services/notification';
import { LanguageService } from '@shared/services/language';
import { CartService } from '../services/cart';

interface CartState {
  cart: CartModel | null;
  loading: boolean;
}

const initialState: CartState = {
  cart: null,
  loading: false,
};

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    items: computed(() => store.cart()?.items ?? []),
    totalItems: computed(() =>
      (store.cart()?.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
    ),
    totalPrice: computed(() =>
      (store.cart()?.items ?? []).reduce(
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0,
      ),
    ),
  })),
  withMethods(
    (
      store,
      cartService = inject(CartService),
      notification = inject(NotificationService),
      language = inject(LanguageService),
    ) => ({
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            cartService.get().pipe(
              tapResponse({
                next: (cart) => patchState(store, { cart, loading: false }),
                error: () => patchState(store, { loading: false }),
              }),
            ),
          ),
        ),
      ),
      addItem: rxMethod<AddCartItemPayloadModel>(
        pipe(
          switchMap((payload) =>
            cartService.addItem(payload).pipe(
              tapResponse({
                next: (cart) => patchState(store, { cart }),
                error: (err: HttpErrorResponse) =>
                  notification.show(
                    'error',
                    err.error?.message ??
                      language.translate('couldNotAddToCart'),
                  ),
              }),
            ),
          ),
        ),
      ),
      updateQuantity: rxMethod<{ itemId: string; quantity: number }>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(({ itemId, quantity }) =>
            cartService.updateItem(itemId, { quantity }).pipe(
              tapResponse({
                next: (cart) => patchState(store, { cart, loading: false }),
                error: (err: HttpErrorResponse) => {
                  patchState(store, { loading: false });
                  notification.show(
                    'error',
                    err.error?.message ?? language.translate('couldNotSave'),
                  );
                },
              }),
            ),
          ),
        ),
      ),
      removeItem: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((itemId) =>
            cartService.removeItem(itemId).pipe(
              tapResponse({
                next: (cart) => patchState(store, { cart, loading: false }),
                error: () => {
                  patchState(store, { loading: false });
                  notification.show(
                    'error',
                    language.translate('couldNotDelete'),
                  );
                },
              }),
            ),
          ),
        ),
      ),
      clearLocal: () => patchState(store, initialState),
    }),
  ),
);
