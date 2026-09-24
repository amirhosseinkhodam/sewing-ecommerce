import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import { QueryClient } from '@tanstack/angular-query-experimental';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { NotificationService } from '@shared/services/notification';
import { USER_ROLES } from '@domain/const/user-roles';
import type { UserModel } from '@domain/models/user';
import { LoginRequestModel, RegisterPayloadModel } from '../models/auth';
import { AuthService } from '../services/auth';

interface AuthState {
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly user: UserModel | null;
  readonly loading: boolean;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: null,
  loading: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isAuthenticated: computed(() => Boolean(store.accessToken())),
    isAdmin: computed(() => store.user()?.role === USER_ROLES.ADMIN),
  })),
  withMethods(
    (
      store,
      authService = inject(AuthService),
      router = inject(Router),
      notification = inject(NotificationService),
      queryClient = inject(QueryClient),
    ) => ({
      isLoggedIn: () => store.accessToken() !== null,
      isAdmin: () => store.user()?.role === USER_ROLES.ADMIN,
      login: rxMethod<LoginRequestModel>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(({ payload, returnUrl }: LoginRequestModel) =>
            authService.login(payload).pipe(
              tapResponse({
                next: ({ accessToken, refreshToken, user }) => {
                  queryClient.clear();
                  localStorage.setItem('accessToken', accessToken);
                  localStorage.setItem('refreshToken', refreshToken);
                  patchState(store, {
                    accessToken,
                    refreshToken,
                    user,
                    loading: false,
                  });
                  router.navigateByUrl(returnUrl ?? '/');
                },
                error: (err: HttpErrorResponse) => {
                  patchState(store, { loading: false });
                  notification.show(
                    'error',
                    err.error?.message ?? 'login failed',
                  );
                },
              }),
            ),
          ),
        ),
      ),
      register: rxMethod<RegisterPayloadModel>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((payload: RegisterPayloadModel) =>
            authService.register(payload).pipe(
              tapResponse({
                next: ({ accessToken, refreshToken, user }) => {
                  queryClient.clear();
                  localStorage.setItem('accessToken', accessToken);
                  localStorage.setItem('refreshToken', refreshToken);
                  patchState(store, {
                    accessToken,
                    refreshToken,
                    user,
                    loading: false,
                  });
                  router.navigateByUrl('/');
                },
                error: (err: HttpErrorResponse) => {
                  patchState(store, { loading: false });
                  notification.show(
                    'error',
                    err.error?.message ?? 'registration failed',
                  );
                },
              }),
            ),
          ),
        ),
      ),
      loadProfile: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            authService.me().pipe(
              tapResponse({
                next: (user) => patchState(store, { user, loading: false }),
                error: () => patchState(store, { loading: false }),
              }),
            ),
          ),
        ),
      ),
      setTokens(accessToken: string, refreshToken: string) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        patchState(store, { accessToken, refreshToken });
      },
      setToken(accessToken: string, refreshToken: string) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        patchState(store, { accessToken, refreshToken });
      },
      setUser(user: UserModel | null) {
        patchState(store, { user });
      },
      logout() {
        queryClient.clear();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        patchState(store, {
          accessToken: null,
          refreshToken: null,
          user: null,
        });
        router.navigateByUrl('/');
      },
    }),
  ),
  withHooks({
    onInit(store) {
      if (store.accessToken()) {
        store.loadProfile();
      }
    },
  }),
);
