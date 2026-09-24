import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import type { ContactMessageModel } from '@domain/models/contact';
import { LanguageService } from '@shared/services/language';
import { NotificationService } from '@shared/services/notification';
import { AdminMessageService } from '../services/admin-message';

interface AdminMessageState {
  messages: ContactMessageModel[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** null = all, true = read only, false = unread only. */
  isRead: boolean | null;
  loading: boolean;
}

const initialState: AdminMessageState = {
  messages: [],
  total: 0,
  unreadCount: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
  isRead: null,
  loading: false,
};

export const AdminMessageStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      messageService = inject(AdminMessageService),
      notification = inject(NotificationService),
      languageService = inject(LanguageService),
    ) => ({
      loadMessages: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            messageService
              .list({
                page: store.page(),
                pageSize: store.pageSize(),
                isRead: store.isRead() ?? undefined,
              })
              .pipe(
                tapResponse({
                  next: (result) =>
                    patchState(store, {
                      messages: result.items,
                      total: result.total,
                      unreadCount: result.unreadCount,
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
  // Second block so these can call loadMessages() from the first.
  withMethods(
    (
      store,
      messageService = inject(AdminMessageService),
      notification = inject(NotificationService),
      languageService = inject(LanguageService),
    ) => ({
      setPage(page: number) {
        patchState(store, { page });
        store.loadMessages();
      },
      setIsRead(isRead: boolean | null) {
        patchState(store, { isRead, page: 1 });
        store.loadMessages();
      },
      markRead: rxMethod<string>(
        pipe(
          switchMap((id) =>
            messageService.markRead(id).pipe(
              tapResponse({
                next: () => store.loadMessages(),
                error: (err: HttpErrorResponse) => {
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
      removeMessage: rxMethod<string>(
        pipe(
          switchMap((id) =>
            messageService.remove(id).pipe(
              tapResponse({
                next: () => {
                  notification.show(
                    'success',
                    languageService.translate('messageDeleted'),
                  );
                  store.loadMessages();
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
