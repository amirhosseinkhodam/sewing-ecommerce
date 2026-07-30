import { HttpInterceptorFn } from '@angular/common/http';

// TODO: Import your AuthStore when created
// import { inject } from '@angular/core';
// import { AuthStore } from '../../features/auth/store/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // const auth = inject(AuthStore);
  // const token = auth.token();
  // if (token) {
  //   req = req.clone({
  //     setHeaders: { Authorization: `Bearer ${token}` },
  //   });
  // }
  return next(req);
};
