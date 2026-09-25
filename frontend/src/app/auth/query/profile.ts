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
 */
export function injectProfileQuery(enabled: () => boolean) {
  const authService = inject(AuthService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.profile],
    enabled: enabled(),
    queryFn: () => firstValueFrom(authService.me()),
  }));
}
