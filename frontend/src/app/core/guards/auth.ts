import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AuthStore } from '@auth/store/auth';
import { profileQueryOptions } from '@auth/query/profile';
import { USER_ROLES } from '@domain/const/user-roles';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return router.createUrlTree(['/']);

  // The role arrives with the profile read. On a hard reload of an admin URL
  // that read is still in flight, so wait for it instead of bouncing the
  // admin to the home page.
  if (auth.isAdmin()) return true;

  try {
    const user = await inject(QueryClient).ensureQueryData(
      profileQueryOptions(),
    );
    return user.role === USER_ROLES.ADMIN ? true : router.createUrlTree(['/']);
  } catch {
    return router.createUrlTree(['/']);
  }
};
