import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import type { OrderModel } from '@domain/models/order';
import type { OrderStatus } from '@domain/const/order-statuses';
import { LanguageService } from '@shared/services/language';
import { NotificationService } from '@shared/services/notification';
import { OrderService } from '../services/order';

interface OrderState {
  orders: OrderModel[];
  order: OrderModel | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  status: OrderStatus | null;
  loading: boolean;
  saving: boolean;
}

const initialState: OrderState = {
  orders: [],
  order: null,
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
  status: null,
  loading: false,
  saving: false,
};

export const OrderStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      orderService = inject(OrderService),
      notification = inject(NotificationService),
      languageService = inject(LanguageService),
    ) => ({
      loadOrders: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            orderService
              .list({
                page: store.page(),
                pageSize: store.pageSize(),
                status: store.status() ?? undefined,
              })
              .pipe(
                tapResponse({
                  next: (result) =>
                    patchState(store, {
                      orders: result.items,
                      total: result.total,
                      page: result.page,
                      pageSize: result.pageSize,
                      totalPages: result.totalPages,
                      loading: false,
                    }),
                  error: (err: HttpErrorResponse) => {
                    patchState(store, { loading: false });
                    notification.show(
                      'error',
                      err.error?.message ??
                        languageService.translate('couldNotLoadData'),
                    );
                  },
                }),
              ),
          ),
        ),
      ),
      loadOrder: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((id) =>
            orderService.get(id).pipe(
              tapResponse({
                next: (order) => patchState(store, { order, loading: false }),
                error: (err: HttpErrorResponse) => {
                  patchState(store, { loading: false, order: null });
                  notification.show(
                    'error',
                    err.error?.message ??
                      languageService.translate('couldNotLoadData'),
                  );
                },
              }),
            ),
          ),
        ),
      ),
    }),
  ),
  // Second block so these methods can call loadOrders() from the first.
  withMethods(
    (
      store,
      orderService = inject(OrderService),
      notification = inject(NotificationService),
      languageService = inject(LanguageService),
    ) => ({
      setPage(page: number) {
        patchState(store, { page });
        store.loadOrders();
      },
      setStatus(status: OrderStatus | null) {
        patchState(store, { status, page: 1 });
        store.loadOrders();
      },
      uploadReceipt: rxMethod<{ id: string; paymentReceipt: string }>(
        pipe(
          tap(() => patchState(store, { saving: true })),
          switchMap(({ id, paymentReceipt }) =>
            orderService.uploadReceipt(id, paymentReceipt).pipe(
              tapResponse({
                next: (order) => {
                  patchState(store, { order, saving: false });
                  notification.show(
                    'success',
                    languageService.translate('receiptUploaded'),
                  );
                },
                error: (err: HttpErrorResponse) => {
                  patchState(store, { saving: false });
                  notification.show(
                    'error',
                    err.error?.message ??
                      languageService.translate('couldNotSave'),
                  );
                },
              }),
            ),
          ),
        ),
      ),
      cancelOrder: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { saving: true })),
          switchMap((id) =>
            orderService.cancel(id).pipe(
              tapResponse({
                next: (order) => {
                  patchState(store, { order, saving: false });
                  notification.show(
                    'success',
                    languageService.translate('orderCancelled'),
                  );
                  store.loadOrders();
                },
                error: (err: HttpErrorResponse) => {
                  patchState(store, { saving: false });
                  notification.show(
                    'error',
                    err.error?.message ??
                      languageService.translate('couldNotSave'),
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
