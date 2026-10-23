import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { adminGuard, authGuard } from '@core/guards/auth';
import { AuthService } from '@auth/services/auth';
import { AuthStore } from '@auth/store/auth';

describe('route guards', () => {
  const loggedIn = signal(false);
  const admin = signal(false);
  const me = vi.fn();
  let queryClient: QueryClient;

  beforeEach(() => {
    loggedIn.set(false);
    admin.set(false);
    me.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: QueryClient, useValue: queryClient },
        {
          provide: AuthStore,
          useValue: { isLoggedIn: loggedIn, isAdmin: admin },
        },
        { provide: AuthService, useValue: { me } },
      ],
    });
  });

  const state = (url: string) => ({ url }) as RouterStateSnapshot;
  const route = {} as ActivatedRouteSnapshot;
  const serialize = (result: unknown) =>
    TestBed.inject(Router).serializeUrl(result as UrlTree);
  const run = (guard: typeof authGuard, url = '/x') =>
    TestBed.runInInjectionContext(() => guard(route, state(url)));

  describe('authGuard', () => {
    it('lets a signed-in user through', () => {
      loggedIn.set(true);

      expect(run(authGuard)).toBe(true);
    });

    it('sends a guest to /login with the page they wanted as returnUrl', () => {
      const result = run(authGuard, '/orders/42?payment=SUCCESS');

      expect(serialize(result)).toBe(
        '/login?returnUrl=%2Forders%2F42%3Fpayment%3DSUCCESS',
      );
    });
  });

  describe('adminGuard', () => {
    it('sends a guest home without asking the server', async () => {
      const result = await run(adminGuard);

      expect(serialize(result)).toBe('/');
      expect(me).not.toHaveBeenCalled();
    });

    it('lets a known admin through without a network call', async () => {
      loggedIn.set(true);
      admin.set(true);

      expect(await run(adminGuard)).toBe(true);
      expect(me).not.toHaveBeenCalled();
    });

    it('waits for the profile on a hard reload and lets an admin in', async () => {
      loggedIn.set(true);
      me.mockReturnValue(
        new (await import('rxjs')).BehaviorSubject({ role: 'ADMIN' }),
      );

      expect(await run(adminGuard)).toBe(true);
    });

    it('turns a customer away after reading the profile', async () => {
      loggedIn.set(true);
      me.mockReturnValue(
        new (await import('rxjs')).BehaviorSubject({ role: 'CUSTOMER' }),
      );

      expect(serialize(await run(adminGuard))).toBe('/');
    });

    it('fails closed when the profile cannot be loaded', async () => {
      loggedIn.set(true);
      const { throwError } = await import('rxjs');
      me.mockReturnValue(throwError(() => new Error('offline')));

      expect(serialize(await run(adminGuard))).toBe('/');
    });
  });
});
