import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { NotificationService } from '@shared/services/notification';
import { LanguageService } from '@shared/services/language';
import type {
  CategoryModel,
  SaveCategoryModel,
} from '../../products/models/product';
import { AdminCategoryService } from '../services/admin-category';

interface AdminCategoryState {
  categories: CategoryModel[];
  loading: boolean;
  saving: boolean;
}

const initialState: AdminCategoryState = {
  categories: [],
  loading: false,
  saving: false,
};

export const AdminCategoryStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      categoryService = inject(AdminCategoryService),
      notification = inject(NotificationService),
      languageService = inject(LanguageService),
    ) => ({
      loadCategories: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            categoryService.list().pipe(
              tapResponse({
                next: (categories) =>
                  patchState(store, { categories, loading: false }),
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
    }),
  ),
  withMethods(
    (
      store,
      categoryService = inject(AdminCategoryService),
      notification = inject(NotificationService),
      languageService = inject(LanguageService),
    ) => ({
      saveCategory: rxMethod<SaveCategoryModel>(
        pipe(
          tap(() => patchState(store, { saving: true })),
          switchMap(({ id, payload }) =>
            (id
              ? categoryService.update(id, payload)
              : categoryService.create(payload)
            ).pipe(
              tapResponse({
                next: () => {
                  patchState(store, { saving: false });
                  notification.show(
                    'success',
                    languageService.translate('categorySaved'),
                  );
                  store.loadCategories();
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
      removeCategory: rxMethod<string>(
        pipe(
          switchMap((id) =>
            categoryService.remove(id).pipe(
              tapResponse({
                next: () => {
                  notification.show(
                    'success',
                    languageService.translate('categoryDeleted'),
                  );
                  store.loadCategories();
                },
                error: (err: HttpErrorResponse) => {
                  const message =
                    err.status === 409
                      ? languageService.translate('cannotDeleteCategory')
                      : (err.error?.message ??
                        languageService.translate('couldNotDelete'));
                  notification.show('error', message);
                },
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
