import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import type { AdminOrderModel } from '@domain/models/order';
import type { OrderStatus } from '@domain/const/order-statuses';
import type { PaymentStatus } from '@domain/const/payment-statuses';
import { LanguageService } from '@shared/services/language';
import { NotificationService } from '@shared/services/notification';
import { AdminOrderService } from '../services/admin-order';

interface AdminOrderState {
  orders: AdminOrderModel[];
  order: AdminOrderModel | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  status: OrderStatus | null;
  paymentStatus: PaymentStatus | null;
  search: string;
  loading: boolean;
  saving: boolean;
}

const initialState: AdminOrderState = {
  orders: [],
  order: null,
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
  status: null,
  paymentStatus: null,
  search: '',
  loading: false,
  saving: false,
};

export const AdminOrderStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      orderService = inject(AdminOrderService),
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
                paymentStatus: store.paymentStatus() ?? undefined,
                search: store.search() || undefined,
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
  // Second block so these methods can call loadOrders()/loadOrder() above.
  withMethods(
    (
      store,
      orderService = inject(AdminOrderService),
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
      setPaymentStatus(paymentStatus: PaymentStatus | null) {
        patchState(store, { paymentStatus, page: 1 });
        store.loadOrders();
      },
      setSearch(search: string) {
        patchState(store, { search, page: 1 });
        store.loadOrders();
      },
      updateStatus: rxMethod<{
        id: string;
        status: OrderStatus;
        trackingCode?: string;
      }>(
        pipe(
          tap(() => patchState(store, { saving: true })),
          switchMap(({ id, status, trackingCode }) =>
            orderService.updateStatus(id, status, trackingCode).pipe(
              tapResponse({
                next: (order) => {
                  patchState(store, { order, saving: false });
                  notification.show(
                    'success',
                    languageService.translate('orderStatusUpdated'),
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
      updatePaymentStatus: rxMethod<{
        id: string;
        paymentStatus: PaymentStatus;
      }>(
        pipe(
          tap(() => patchState(store, { saving: true })),
          switchMap(({ id, paymentStatus }) =>
            orderService.updatePaymentStatus(id, paymentStatus).pipe(
              tapResponse({
                next: (order) => {
                  patchState(store, { order, saving: false });
                  notification.show(
                    'success',
                    languageService.translate('paymentStatusUpdated'),
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
