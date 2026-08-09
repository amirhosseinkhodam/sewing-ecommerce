import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../features/auth/store/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  return router.parseUrl('/login');
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isAdmin()) return true;
  return router.parseUrl('/');
};
