import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { concatMap, pipe, switchMap, tap } from 'rxjs';
import type { AddressModel, AddressPayloadModel } from '@domain/models/address';
import { NotificationService } from '@shared/services/notification';
import { LanguageService } from '@shared/services/language';
import { AddressService } from '../services/address';

interface AddressesState {
  addresses: AddressModel[];
  loading: boolean;
}

const initialState: AddressesState = {
  addresses: [],
  loading: false,
};

export const AddressesStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      addressService = inject(AddressService),
      notification = inject(NotificationService),
      language = inject(LanguageService),
    ) => ({
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            addressService.list().pipe(
              tapResponse({
                next: (addresses) =>
                  patchState(store, { addresses, loading: false }),
                error: () => patchState(store, { loading: false }),
              }),
            ),
          ),
        ),
      ),
      save: rxMethod<{ id?: string; payload: AddressPayloadModel }>(
        pipe(
          concatMap(({ id, payload }) =>
            (id
              ? addressService.update(id, payload)
              : addressService.create(payload)
            ).pipe(
              tapResponse({
                next: () => {
                  notification.show(
                    'success',
                    language.translate('addressSaved'),
                  );
                  patchState(store, { loading: true });
                },
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
                      patchState(store, { addresses, loading: false }),
                    error: () => patchState(store, { loading: false }),
                  }),
                ),
              ),
            ),
          ),
        ),
      ),
      remove: rxMethod<string>(
        pipe(
          switchMap((id) =>
            addressService.remove(id).pipe(
              tapResponse({
                next: () => {
                  notification.show(
                    'success',
                    language.translate('addressDeleted'),
                  );
                  patchState(store, {
                    addresses: store.addresses().filter((a) => a.id !== id),
                  });
                },
                error: () =>
                  notification.show(
                    'error',
                    language.translate('couldNotDelete'),
                  ),
              }),
            ),
          ),
        ),
      ),
      setDefault: rxMethod<string>(
        pipe(
          switchMap((id) =>
            addressService.update(id, { isDefault: true }).pipe(
              tapResponse({
                next: () =>
                  patchState(store, {
                    addresses: store.addresses().map((a) => ({
                      ...a,
                      isDefault: a.id === id,
                    })),
                  }),
                error: () =>
                  notification.show(
                    'error',
                    language.translate('couldNotSave'),
                  ),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
