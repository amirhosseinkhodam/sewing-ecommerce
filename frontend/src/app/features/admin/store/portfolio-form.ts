import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import type {
  PortfolioModel,
  PortfolioPayloadModel,
} from '@domain/models/portfolio';
import { LanguageService } from '@shared/services/language';
import { NotificationService } from '@shared/services/notification';
import type { CategoryModel } from '../../products/models/product';
import { CategoryService } from '../../products/services/category';
import { AdminPortfolioService } from '../services/admin-portfolio';

export interface SavePortfolioModel {
  readonly id?: string;
  readonly payload: PortfolioPayloadModel;
}

interface PortfolioFormState {
  categories: CategoryModel[];
  item: PortfolioModel | null;
  loading: boolean;
  saving: boolean;
}

const initialState: PortfolioFormState = {
  categories: [],
  item: null,
  loading: false,
  saving: false,
};

export const PortfolioFormStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      portfolioService = inject(AdminPortfolioService),
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
      loadItem: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((id) =>
            portfolioService.get(id).pipe(
              tapResponse({
                next: (item) => patchState(store, { item, loading: false }),
                error: (err: HttpErrorResponse) => {
                  patchState(store, { loading: false });
                  notification.show(
                    'error',
                    err.error?.message ??
                      languageService.translate('couldNotLoadData'),
                  );
                  router.navigate(['/admin/portfolio']);
                },
              }),
            ),
          ),
        ),
      ),
      save: rxMethod<SavePortfolioModel>(
        pipe(
          tap(() => patchState(store, { saving: true })),
          switchMap(({ id, payload }) =>
            (id
              ? portfolioService.update(id, payload)
              : portfolioService.create(payload)
            ).pipe(
              tapResponse({
                next: () => {
                  patchState(store, { saving: false });
                  notification.show(
                    'success',
                    languageService.translate('portfolioSaved'),
                  );
                  router.navigate(['/admin/portfolio']);
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
