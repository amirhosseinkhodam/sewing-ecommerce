import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, switchMap, throwError } from "rxjs";
import { AuthStore } from "../../features/auth/store/auth";
import { AuthService } from "../../features/auth/services/auth";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);

  if (req.url.includes("/api/auth/refresh")) {
    return next(req);
  }

  const token = auth.token();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token && auth.refreshToken()) {
        const authService = inject(AuthService);
        return authService.refresh(auth.refreshToken()!).pipe(
          switchMap((res) => {
            auth.setToken(res.accessToken, res.refreshToken);
            return next(
              req.clone({
                setHeaders: { Authorization: `Bearer ${res.accessToken}` },
              }),
            );
          }),
          catchError(() => {
            auth.logout();
            return throwError(() => error);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
