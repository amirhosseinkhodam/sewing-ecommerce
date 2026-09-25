import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import { QueryClient } from '@tanstack/angular-query-experimental';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { NotificationService } from '@shared/services/notification';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { USER_ROLES } from '@domain/const/user-roles';
import type { UserModel } from '@domain/models/user';
import { LoginRequestModel, RegisterPayloadModel } from '../models/auth';
import { AuthService } from '../services/auth';
import { injectProfileQuery } from '../query/profile';

/**
 * Session state only. The tokens are client-owned and must be readable
 * synchronously by the interceptor and the guards, so they stay here; the
 * user account itself is server state and lives in the `profile` query.
 */
interface AuthState {
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  /** In-flight login/registration, not the profile read. */
  readonly loading: boolean;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withProps((store) => ({
    /** Fetches as soon as a token exists, which covers the page-reload case. */
    _profileQuery: injectProfileQuery(() => Boolean(store.accessToken())),
  })),
  withComputed((store) => ({
    user: computed(() => store._profileQuery.data() ?? null),
    profileLoading: computed(
      () => Boolean(store.accessToken()) && store._profileQuery.isPending(),
    ),
  })),
  withMethods(
    (
      store,
      authService = inject(AuthService),
      router = inject(Router),
      notification = inject(NotificationService),
      queryClient = inject(QueryClient),
    ) => {
      /**
       * A fresh session starts from an empty cache, then seeds the profile
       * with the user the auth response already returned — no extra GET /me.
       */
      const startSession = ({
        accessToken,
        refreshToken,
        user,
      }: {
        accessToken: string;
        refreshToken: string;
        user: UserModel;
      }) => {
        queryClient.clear();
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        patchState(store, { accessToken, refreshToken, loading: false });
        queryClient.setQueryData<UserModel>([QUERY_KEYS.profile], user);
      };

      return {
        isLoggedIn: () => store.accessToken() !== null,
        isAdmin: () => store.user()?.role === USER_ROLES.ADMIN,
        login: rxMethod<LoginRequestModel>(
          pipe(
            tap(() => patchState(store, { loading: true })),
            switchMap(({ payload, returnUrl }: LoginRequestModel) =>
              authService.login(payload).pipe(
                tapResponse({
                  next: (response) => {
                    startSession(response);
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
                  next: (response) => {
                    startSession(response);
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
        /** Used by the interceptor after a silent refresh. */
        setToken(accessToken: string, refreshToken: string) {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          patchState(store, { accessToken, refreshToken });
        },
        logout() {
          queryClient.clear();
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          patchState(store, { accessToken: null, refreshToken: null });
          router.navigateByUrl('/');
        },
      };
    },
  ),
);
