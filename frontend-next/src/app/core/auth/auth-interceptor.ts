import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { AuthRefresh } from './auth-refresh';
import { AuthSessionStore } from './session';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const path = request.url.split(/[?#]/)[0];
  if (!path.startsWith('/api/') || /^\/api\/auth\/(login|register|refresh)\/?$/.test(path)) {
    return next(request);
  }

  const session = inject(AuthSessionStore);
  const refresh = inject(AuthRefresh);
  const token = session.accessToken();
  const authorized = (accessToken: string) =>
    request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });

  return next(token ? authorized(token) : request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !token) {
        return throwError(() => error);
      }

      const currentToken = session.accessToken();
      if (!currentToken) return throwError(() => error);
      const refreshed = currentToken !== token ? of(currentToken) : refresh.accessToken();

      return refreshed.pipe(
        switchMap((accessToken) =>
          next(authorized(accessToken)).pipe(
            catchError((retryError: unknown) => {
              if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
                refresh.invalidate(accessToken);
              }
              return throwError(() => retryError);
            }),
          ),
        ),
      );
    }),
  );
};
