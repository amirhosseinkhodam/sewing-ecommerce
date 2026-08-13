import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { NotificationService } from '@shared/services/notification';
import { LanguageService } from '@shared/services/language';
import type {
  CategoryModel,
  ProductDetailModel,
  SaveProductModel,
} from '../../products/models/product';
import { CategoryService } from '../../products/services/category';
import { AdminProductService } from '../services/admin-product';

interface ProductFormState {
  categories: CategoryModel[];
  product: ProductDetailModel | null;
  loading: boolean;
  saving: boolean;
}

const initialState: ProductFormState = {
  categories: [],
  product: null,
  loading: false,
  saving: false,
};

export const ProductFormStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      adminProductService = inject(AdminProductService),
      categoryService = inject(CategoryService),
      router = inject(Router),
      notification = inject(NotificationService),
      languageService = inject(LanguageService),
    ) => ({
      loadCategories: rxMethod<void>(
        pipe(
          switchMap(() =>
            categoryService.list().pipe(
              tapResponse({
                next: (categories) => patchState(store, { categories }),
                error: (err: HttpErrorResponse) => {
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
      loadProduct: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((id) =>
            adminProductService.get(id).pipe(
              tapResponse({
                next: (product) =>
                  patchState(store, { product, loading: false }),
                error: (err: HttpErrorResponse) => {
                  patchState(store, { loading: false });
                  notification.show(
                    'error',
                    err.error?.message ??
                      languageService.translate('couldNotLoadData'),
                  );
                  router.navigate(['/admin/products']);
                },
              }),
            ),
          ),
        ),
      ),
      save: rxMethod<SaveProductModel>(
        pipe(
          tap(() => patchState(store, { saving: true })),
          switchMap(({ id, payload }) =>
            (id
              ? adminProductService.update(id, payload)
              : adminProductService.create(payload)
            ).pipe(
              tapResponse({
                next: () => {
                  patchState(store, { saving: false });
                  notification.show(
                    'success',
                    languageService.translate('productSaved'),
                  );
                  router.navigate(['/admin/products']);
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
