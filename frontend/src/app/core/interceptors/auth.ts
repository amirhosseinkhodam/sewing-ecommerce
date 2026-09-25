import {
  HttpErrorResponse,
  type HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthStore } from '@auth/store/auth';
import { AuthService } from '@auth/services/auth';

let refreshPending:
  | import('rxjs').Observable<import('@auth/models/auth').AuthResponseModel>
  | null = null;

/**
 * The only unauthenticated auth endpoints. `/api/auth/me` and
 * `/api/auth/profile` are behind `JwtAuthGuard` and must carry the token —
 * and refresh is excluded here so a 401 on it cannot retry itself.
 */
const PUBLIC_AUTH_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const path = req.url.split(/[?#]/)[0];
  if (PUBLIC_AUTH_PATHS.includes(path)) {
    return next(req);
  }

  const auth = inject(AuthStore);
  // Both must be resolved here: `catchError` runs outside the injection
  // context, where `inject()` throws NG0203.
  const authService = inject(AuthService);
  const token = auth.accessToken();

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !token || !auth.refreshToken()) {
        return throwError(() => error);
      }

      // One refresh per burst of 401s; `shareReplay` lets every queued
      // request reuse the single in-flight call and its result.
      if (!refreshPending) {
        refreshPending = authService.refresh(auth.refreshToken()!).pipe(
          finalize(() => {
            refreshPending = null;
          }),
          shareReplay({ bufferSize: 1, refCount: true }),
        );
      }

      return refreshPending.pipe(
        switchMap((res) => {
          auth.setToken(res.accessToken, res.refreshToken);
          return next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` },
            }),
          );
        }),
        catchError((retryError: unknown) => {
          auth.logout();
          return throwError(() => retryError);
        }),
      );
    }),
  );
};
