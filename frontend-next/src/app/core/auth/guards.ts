import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionStore } from './session';

/**
 * Requires an authenticated user, preserving where they were headed so login
 * can send them back.
 *
 * Client guards are UX only — the backend's JwtAuthGuard is the real boundary.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(AuthSessionStore);
  const router = inject(Router);

  if (session.isAuthenticated()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/** Requires an authenticated user with the ADMIN role. */
export const adminGuard: CanActivateFn = () => {
  const session = inject(AuthSessionStore);
  const router = inject(Router);

  if (session.isAuthenticated() && session.isAdmin()) return true;

  return router.createUrlTree(['/']);
};
