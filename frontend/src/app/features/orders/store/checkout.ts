import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import type { AddressModel, AddressPayloadModel } from '@domain/models/address';
import type { CreateOrderPayloadModel } from '@domain/models/order';
import { NotificationService } from '@shared/services/notification';
import { LanguageService } from '@shared/services/language';
import { AddressService } from '../../addresses/services/address';
import { CartStore } from '../../cart/store/cart';
import { OrderService } from '../services/order';

interface CheckoutState {
  addresses: AddressModel[];
  loadingAddresses: boolean;
  placing: boolean;
}

const initialState: CheckoutState = {
  addresses: [],
  loadingAddresses: false,
  placing: false,
};

export const CheckoutStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      addressService = inject(AddressService),
      orderService = inject(OrderService),
      cartStore = inject(CartStore),
      router = inject(Router),
      notification = inject(NotificationService),
      language = inject(LanguageService),
    ) => ({
      loadAddresses: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loadingAddresses: true })),
          switchMap(() =>
            addressService.list().pipe(
              tapResponse({
                next: (addresses) =>
                  patchState(store, { addresses, loadingAddresses: false }),
                error: () => patchState(store, { loadingAddresses: false }),
              }),
            ),
          ),
        ),
      ),
      saveAddress: rxMethod<AddressPayloadModel>(
        pipe(
          switchMap((payload) =>
            addressService.create(payload).pipe(
              tapResponse({
                next: () => patchState(store, { loadingAddresses: true }),
                error: (err: HttpErrorResponse) =>
                  notification.show(
                    'error',
                    err.error?.message ?? language.translate('couldNotSave'),
                  ),
              }),
              switchMap(() =>
                addressService.list().pipe(
                  tapResponse({
                    next: (addresses) =>
                      patchState(store, { addresses, loadingAddresses: false }),
                    error: () => patchState(store, { loadingAddresses: false }),
                  }),
                ),
              ),
            ),
          ),
        ),
      ),
      placeOrder: rxMethod<CreateOrderPayloadModel>(
        pipe(
          tap(() => patchState(store, { placing: true })),
          switchMap((payload) =>
            orderService.create(payload).pipe(
              tapResponse({
                next: () => {
                  patchState(store, { placing: false });
                  cartStore.clearLocal();
                  notification.show(
                    'success',
                    language.translate('orderPlaced'),
                  );
                  router.navigateByUrl('/');
                },
                error: (err: HttpErrorResponse) => {
                  patchState(store, { placing: false });
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
    }),
  ),
);
