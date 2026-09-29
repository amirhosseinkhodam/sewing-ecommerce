import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { AuthService } from '../services/auth';

/**
 * The signed-in user's account. Idle for guests.
 *
 * `AuthStore` keeps the session tokens (client state) and mirrors this query's
 * data into `user` so guards, the navbar and the interceptor keep their
 * synchronous reads.
 *
 * `profileQueryOptions` is the injection-context form: pass it to
 * `QueryClient.ensureQueryData` when the caller needs the account *now* (the
 * admin guard on a hard reload) instead of subscribing to it.
 */
export function profileQueryOptions() {
  const authService = inject(AuthService);
  return {
    queryKey: [QUERY_KEYS.profile] as const,
    queryFn: () => firstValueFrom(authService.me()),
  };
}

export function injectProfileQuery(enabled: () => boolean) {
  // Built eagerly here: the query factory runs in a computation, not an
  // injection context, so `inject(AuthService)` cannot happen inside it.
  const options = profileQueryOptions();
  return injectQuery(() => ({ ...options, enabled: enabled() }));
}
