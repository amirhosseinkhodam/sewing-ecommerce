import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { NotificationService } from '@shared/services/notification';
import { LanguageService } from '@shared/services/language';
import type {
  ProductModel,
  ProductQueryModel,
} from '../../products/models/product';
import { AdminProductService } from '../services/admin-product';

const DEFAULT_QUERY: ProductQueryModel = { page: 1, pageSize: 10 };

interface AdminProductState {
  products: ProductModel[];
  total: number;
  totalPages: number;
  query: ProductQueryModel;
  loading: boolean;
}

const initialState: AdminProductState = {
  products: [],
  total: 0,
  totalPages: 1,
  query: { ...DEFAULT_QUERY },
  loading: false,
};

export const AdminProductStore = signalStore(
  withState(initialState),
  withMethods((store, productService = inject(AdminProductService)) => ({
    loadProducts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          productService.list(store.query()).pipe(
            tapResponse({
              next: (res) =>
                patchState(store, {
                  products: res.items,
                  total: res.total,
                  totalPages: res.totalPages,
                  loading: false,
                }),
              error: () => patchState(store, { loading: false }),
            }),
          ),
        ),
      ),
    ),
  })),
  withMethods(
    (
      store,
      productService = inject(AdminProductService),
      notification = inject(NotificationService),
      languageService = inject(LanguageService),
    ) => ({
      patchQuery: (patch: Partial<ProductQueryModel>) => {
        patchState(store, {
          query: { ...store.query(), ...patch, page: 1 },
        });
        store.loadProducts();
      },
      setPage: (page: number) => {
        patchState(store, { query: { ...store.query(), page } });
        store.loadProducts();
      },
      removeProduct: rxMethod<string>(
        pipe(
          switchMap((id) =>
            productService.remove(id).pipe(
              tapResponse({
                next: () => {
                  notification.show(
                    'success',
                    languageService.translate('productDeleted'),
                  );
                  store.loadProducts();
                },
                error: (err: HttpErrorResponse) => {
                  notification.show(
                    'error',
                    err.error?.message ??
                      languageService.translate('couldNotDelete'),
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
