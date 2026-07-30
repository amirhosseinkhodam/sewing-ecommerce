import { inject } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";
import {
  AuthPayloadModel,
  AuthUserModel,
  RegisterPayloadModel,
} from "../models/auth";
import { AuthService } from "../services/auth";
import { NotificationService } from "../../../shared/services/notification";
import { Router } from "@angular/router";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUserModel | null;
  loading: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  user: null,
  loading: false,
};

export const AuthStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withMethods(
    (
      store,
      authService = inject(AuthService),
      router = inject(Router),
      notification = inject(NotificationService),
    ) => ({
      isLoggedIn: () => store.token() !== null,
      isAdmin: () => store.user()?.role === "ADMIN",
      login: rxMethod<AuthPayloadModel>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((payload: AuthPayloadModel) =>
            authService.login(payload).pipe(
              tapResponse({
                next: (res) => {
                  localStorage.setItem("accessToken", res.accessToken);
                  localStorage.setItem("refreshToken", res.refreshToken);
                  patchState(store, {
                    token: res.accessToken,
                    refreshToken: res.refreshToken,
                    user: res.user,
                    loading: false,
                  });
                  router.navigateByUrl("/");
                },
                error: (err: HttpErrorResponse) => {
                  patchState(store, { loading: false });
                  notification.show(
                    err.error?.message ?? "login failed",
                    "error",
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
                next: (res) => {
                  localStorage.setItem("accessToken", res.accessToken);
                  localStorage.setItem("refreshToken", res.refreshToken);
                  patchState(store, {
                    token: res.accessToken,
                    refreshToken: res.refreshToken,
                    user: res.user,
                    loading: false,
                  });
                  router.navigateByUrl("/");
                },
                error: (err: HttpErrorResponse) => {
                  patchState(store, { loading: false });
                  notification.show(
                    err.error?.message ?? "registration failed",
                    "error",
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
      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        patchState(store, {
          token: null,
          refreshToken: null,
          user: null,
        });
        router.navigateByUrl("/");
      },
    }),
  ),
  withHooks({
    onInit(store) {
      if (store.token()) {
        store.loadProfile();
      }
    },
  }),
);
