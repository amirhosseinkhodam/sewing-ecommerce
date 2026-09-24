import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import type { PortfolioModel } from '@domain/models/portfolio';
import { LanguageService } from '@shared/services/language';
import { NotificationService } from '@shared/services/notification';
import type { CategoryModel } from '../../products/models/product';
import { CategoryService } from '../../products/services/category';
import { PortfolioService } from '../services/portfolio';

interface PortfolioState {
  items: PortfolioModel[];
  item: PortfolioModel | null;
  categories: CategoryModel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  category: string | null;
  loading: boolean;
}

const initialState: PortfolioState = {
  items: [],
  item: null,
  categories: [],
  total: 0,
  page: 1,
  pageSize: 12,
  totalPages: 0,
  category: null,
  loading: false,
};

export const PortfolioStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      portfolioService = inject(PortfolioService),
      categoryService = inject(CategoryService),
      notification = inject(NotificationService),
      languageService = inject(LanguageService),
    ) => ({
      loadItems: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            portfolioService
              .list({
                page: store.page(),
                pageSize: store.pageSize(),
                category: store.category() ?? undefined,
              })
              .pipe(
                tapResponse({
                  next: (result) =>
                    patchState(store, {
                      items: result.items,
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
      loadItem: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((slug) =>
            portfolioService.getBySlug(slug).pipe(
              tapResponse({
                next: (item) => patchState(store, { item, loading: false }),
                error: (err: HttpErrorResponse) => {
                  patchState(store, { loading: false, item: null });
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
      loadCategories: rxMethod<void>(
        pipe(
          switchMap(() =>
            categoryService.list().pipe(
              tapResponse({
                next: (categories) => patchState(store, { categories }),
                // A failed category list only costs the filter dropdown, so it
                // stays silent rather than covering the gallery with an error.
                error: () => patchState(store, { categories: [] }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
  // Second block so these can call loadItems() from the first.
  withMethods((store) => ({
    setPage(page: number) {
      patchState(store, { page });
      store.loadItems();
    },
    setCategory(category: string | null) {
      patchState(store, { category, page: 1 });
      store.loadItems();
    },
  })),
);
