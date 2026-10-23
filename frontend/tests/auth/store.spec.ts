import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { AuthStore } from '@auth/store/auth';
import { NotificationService } from '@shared/services/notification';

const USER = {
  id: 'u1',
  firstName: 'Sara',
  lastName: 'Ahmadi',
  phone: '09121111111',
  role: 'CUSTOMER',
};
const RESPONSE = { accessToken: 'acc', refreshToken: 'ref', user: USER };
const PAYLOAD = { phone: '09121111111', password: 'password123' };

describe('AuthStore', () => {
  let store: InstanceType<typeof AuthStore>;
  let controller: HttpTestingController;
  let router: Router;
  let navigate: ReturnType<typeof vi.spyOn>;
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(queryClient),
      ],
    });
    store = TestBed.inject(AuthStore);
    controller = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    store.logout();
    navigate.mockClear();
  });

  afterEach(() => {
    controller.verify();
  });

  it('starts signed out', () => {
    expect(store.isLoggedIn()).toBe(false);
    expect(store.isAdmin()).toBe(false);
    expect(store.user()).toBeNull();
  });

  describe('login', () => {
    it('stores both tokens, seeds the profile and goes home', () => {
      store.login({ payload: PAYLOAD });
      expect(store.loading()).toBe(true);

      controller.expectOne('/api/auth/login').flush(RESPONSE);

      expect(store.loading()).toBe(false);
      expect(store.isLoggedIn()).toBe(true);
      expect(store.accessToken()).toBe('acc');
      expect(localStorage.getItem('accessToken')).toBe('acc');
      expect(localStorage.getItem('refreshToken')).toBe('ref');
      expect(queryClient.getQueryData(['profile'])).toEqual(USER);
      expect(navigate).toHaveBeenCalledWith('/');
    });

    // The profile query has no staleTime, so the seeded user is revalidated
    // once in the background. AuthStore's comment claims "no extra GET /me";
    // this pins what actually happens (see the report).
    it('shows the seeded user immediately and revalidates it with one GET /me', () => {
      store.login({ payload: PAYLOAD });
      controller.expectOne('/api/auth/login').flush(RESPONSE);
      TestBed.tick();

      expect(store.user()).toEqual(USER);
      controller.expectOne('/api/auth/me').flush(USER);
      expect(store.user()).toEqual(USER);
    });

    it('goes to a safe returnUrl', () => {
      store.login({ payload: PAYLOAD, returnUrl: '/orders/5' });
      controller.expectOne('/api/auth/login').flush(RESPONSE);

      expect(navigate).toHaveBeenCalledWith('/orders/5');
    });

    it.each(['https://evil.example', '//evil.example', '/login'])(
      'ignores the unsafe returnUrl %s',
      (returnUrl) => {
        store.login({ payload: PAYLOAD, returnUrl });
        controller.expectOne('/api/auth/login').flush(RESPONSE);

        expect(navigate).toHaveBeenCalledWith('/');
      },
    );

    it('stays signed out and shows a toast on bad credentials', () => {
      store.login({ payload: PAYLOAD });

      controller
        .expectOne('/api/auth/login')
        .flush(
          { statusCode: 401, message: 'Invalid credentials' },
          { status: 401, statusText: 'Unauthorized' },
        );

      expect(store.loading()).toBe(false);
      expect(store.isLoggedIn()).toBe(false);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(navigate).not.toHaveBeenCalled();
      expect(TestBed.inject(NotificationService).notification()).toMatchObject({
        type: 'error',
      });
    });
  });

  describe('register', () => {
    const payload = {
      firstName: 'Sara',
      lastName: 'Ahmadi',
      phone: '09121111111',
      password: 'password123',
    };

    it('signs the new customer in', () => {
      store.register({ payload, returnUrl: '/cart' });

      controller.expectOne('/api/auth/register').flush(RESPONSE);

      expect(store.isLoggedIn()).toBe(true);
      expect(navigate).toHaveBeenCalledWith('/cart');
    });

    it('reports a duplicate phone without signing in', () => {
      store.register({ payload });

      controller
        .expectOne('/api/auth/register')
        .flush(
          { statusCode: 409, message: 'Phone already registered' },
          { status: 409, statusText: 'Conflict' },
        );

      expect(store.isLoggedIn()).toBe(false);
      expect(store.loading()).toBe(false);
    });
  });

  it('starts a fresh session from an empty cache', () => {
    queryClient.setQueryData(['cart'], { items: ['stale'] });

    store.login({ payload: PAYLOAD });
    controller.expectOne('/api/auth/login').flush(RESPONSE);

    expect(queryClient.getQueryData(['cart'])).toBeUndefined();
  });

  it('setToken swaps both tokens in state and storage (silent refresh)', () => {
    store.setToken('a2', 'r2');

    expect(store.accessToken()).toBe('a2');
    expect(store.refreshToken()).toBe('r2');
    expect(localStorage.getItem('accessToken')).toBe('a2');
    expect(localStorage.getItem('refreshToken')).toBe('r2');
  });

  it('logout wipes tokens, the query cache and goes home', () => {
    store.login({ payload: PAYLOAD });
    controller.expectOne('/api/auth/login').flush(RESPONSE);
    navigate.mockClear();

    store.logout();

    expect(store.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(queryClient.getQueryData(['profile'])).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('isAdmin reflects the role of the signed-in user', () => {
    store.login({ payload: PAYLOAD });
    controller
      .expectOne('/api/auth/login')
      .flush({ ...RESPONSE, user: { ...USER, role: 'ADMIN' } });

    expect(store.isAdmin()).toBe(true);
  });
});
