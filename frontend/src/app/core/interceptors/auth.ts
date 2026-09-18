import {
  HttpErrorResponse,
  type HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, switchMap, throwError } from 'rxjs';
import { AuthStore } from '@auth/store/auth';
import { AuthService } from '@auth/services/auth';

let refreshPending:
  | import('rxjs').Observable<import('@auth/models/auth').AuthResponseModel>
  | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const path = req.url.split(/[?#]/)[0];
  if (path.startsWith('/api/auth/')) {
    return next(req);
  }

  const auth = inject(AuthStore);
  const token = auth.accessToken();

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !token || !auth.refreshToken()) {
        return throwError(() => error);
      }

      if (!refreshPending) {
        const authService = inject(AuthService);
        refreshPending = authService.refresh(auth.refreshToken()!).pipe(
          finalize(() => {
            refreshPending = null;
          }),
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
