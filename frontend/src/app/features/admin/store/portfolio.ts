import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import type { PortfolioModel } from '@domain/models/portfolio';
import { LanguageService } from '@shared/services/language';
import { NotificationService } from '@shared/services/notification';
import { AdminPortfolioService } from '../services/admin-portfolio';

interface AdminPortfolioState {
  items: PortfolioModel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search: string;
  loading: boolean;
}

const initialState: AdminPortfolioState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
  search: '',
  loading: false,
};

export const AdminPortfolioStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      portfolioService = inject(AdminPortfolioService),
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
                search: store.search() || undefined,
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
    }),
  ),
  // Second block so these can call loadItems() from the first.
  withMethods(
    (
      store,
      portfolioService = inject(AdminPortfolioService),
      notification = inject(NotificationService),
      languageService = inject(LanguageService),
    ) => ({
      setPage(page: number) {
        patchState(store, { page });
        store.loadItems();
      },
      setSearch(search: string) {
        patchState(store, { search, page: 1 });
        store.loadItems();
      },
      removeItem: rxMethod<string>(
        pipe(
          switchMap((id) =>
            portfolioService.remove(id).pipe(
              tapResponse({
                next: () => {
                  notification.show(
                    'success',
                    languageService.translate('portfolioDeleted'),
                  );
                  store.loadItems();
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
