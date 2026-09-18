import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { USER_ROLES } from '@domain/const/user-roles';
import type { UserModel } from '@domain/models/user';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

interface SessionState {
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly user: UserModel | null;
}

/**
 * The authenticated session: tokens and the current user.
 *
 * This is client-owned state rather than server data — the interceptor and the
 * route guards read it synchronously — so it belongs in a store, unlike the
 * domain data that TanStack Query caches (see specs/000-architecture.md §5).
 *
 * Deliberately knows nothing about routing: navigation after login/logout is
 * the caller's concern.
 */
export const AuthSessionStore = signalStore(
  { providedIn: 'root' },
  withState<SessionState>(() => ({
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    user: null,
  })),
  withComputed((store) => ({
    isAuthenticated: computed(() => Boolean(store.accessToken())),
    isAdmin: computed(() => store.user()?.role === USER_ROLES.ADMIN),
  })),
  withMethods((store) => ({
    setTokens(accessToken: string, refreshToken: string): void {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      patchState(store, { accessToken, refreshToken });
    },

    setUser(user: UserModel | null): void {
      patchState(store, { user });
    },

    clear(): void {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      patchState(store, { accessToken: null, refreshToken: null, user: null });
    },
  })),
);
