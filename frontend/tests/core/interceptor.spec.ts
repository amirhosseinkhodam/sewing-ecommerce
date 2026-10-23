import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { authInterceptor } from '@core/interceptors/auth';
import { AuthService } from '@auth/services/auth';
import { AuthStore } from '@auth/store/auth';

const NEW_TOKENS = {
  accessToken: 'new-access',
  refreshToken: 'new-refresh',
  user: {},
};

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  const accessToken = signal<string | null>(null);
  const refreshToken = signal<string | null>(null);
  const setToken = vi.fn();
  const logout = vi.fn();
  const refresh = vi.fn();

  beforeEach(() => {
    accessToken.set('old-access');
    refreshToken.set('old-refresh');
    setToken.mockReset();
    logout.mockReset();
    refresh.mockReset().mockReturnValue(of(NEW_TOKENS));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthStore,
          useValue: { accessToken, refreshToken, setToken, logout },
        },
        { provide: AuthService, useValue: { refresh } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('adds the bearer token to API calls', () => {
    http.get('/api/cart').subscribe();

    const req = controller.expectOne('/api/cart');
    expect(req.request.headers.get('Authorization')).toBe('Bearer old-access');
    req.flush({});
  });

  it('sends no Authorization header when signed out', () => {
    accessToken.set(null);

    http.get('/api/products').subscribe();

    const req = controller.expectOne('/api/products');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it.each(['/api/auth/login', '/api/auth/register', '/api/auth/refresh'])(
    'never attaches the token to %s',
    (url) => {
      http.post(`${url}?x=1`, {}).subscribe();

      const req = controller.expectOne(`${url}?x=1`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    },
  );

  it('does send the token to /api/auth/me and /api/auth/profile', () => {
    http.get('/api/auth/me').subscribe();
    http.patch('/api/auth/profile', {}).subscribe();

    for (const url of ['/api/auth/me', '/api/auth/profile']) {
      const req = controller.expectOne(url);
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer old-access',
      );
      req.flush({});
    }
  });

  it('refreshes on 401, stores the new tokens and retries with the new one', () => {
    let body: unknown;
    http.get('/api/cart').subscribe((value) => (body = value));

    controller
      .expectOne('/api/cart')
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'x' });
    expect(refresh).toHaveBeenCalledWith('old-refresh');
    expect(setToken).toHaveBeenCalledWith('new-access', 'new-refresh');

    const retry = controller.expectOne('/api/cart');
    expect(retry.request.headers.get('Authorization')).toBe(
      'Bearer new-access',
    );
    retry.flush({ ok: true });
    expect(body).toEqual({ ok: true });
    expect(logout).not.toHaveBeenCalled();
  });

  it('shares one refresh between simultaneous 401s', () => {
    const inFlight = new Subject<typeof NEW_TOKENS>();
    refresh.mockReturnValue(inFlight);
    http.get('/api/cart').subscribe();
    http.get('/api/orders').subscribe();

    const unauthorized = { status: 401, statusText: 'x' };
    controller.expectOne('/api/cart').flush({}, unauthorized);
    controller.expectOne('/api/orders').flush({}, unauthorized);
    inFlight.next(NEW_TOKENS);
    inFlight.complete();

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(setToken).toHaveBeenCalledWith('new-access', 'new-refresh');
    controller.expectOne('/api/cart').flush({});
    controller.expectOne('/api/orders').flush({});
  });

  it('logs out and surfaces the error when the refresh fails', () => {
    refresh.mockReturnValue(throwError(() => new Error('expired')));
    let failure: unknown;
    http.get('/api/cart').subscribe({ error: (e) => (failure = e) });

    controller
      .expectOne('/api/cart')
      .flush({}, { status: 401, statusText: 'x' });

    expect(logout).toHaveBeenCalledTimes(1);
    expect(failure).toBeDefined();
  });

  it('retries only once: a 401 on the retry logs out instead of looping', () => {
    let failure: unknown;
    http.get('/api/cart').subscribe({ error: (e) => (failure = e) });

    controller
      .expectOne('/api/cart')
      .flush({}, { status: 401, statusText: 'x' });
    controller
      .expectOne('/api/cart')
      .flush({}, { status: 401, statusText: 'x' });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledTimes(1);
    expect(failure).toBeDefined();
  });

  it('does not refresh without a refresh token', () => {
    refreshToken.set(null);
    let status = 0;
    http.get('/api/cart').subscribe({ error: (e) => (status = e.status) });

    controller
      .expectOne('/api/cart')
      .flush({}, { status: 401, statusText: 'x' });

    expect(refresh).not.toHaveBeenCalled();
    expect(status).toBe(401);
  });

  it('does not refresh for a signed-out request that gets 401', () => {
    accessToken.set(null);

    http.get('/api/cart').subscribe({ error: () => undefined });
    controller
      .expectOne('/api/cart')
      .flush({}, { status: 401, statusText: 'x' });

    expect(refresh).not.toHaveBeenCalled();
  });

  it.each([400, 403, 404, 500])(
    'passes a %s through without refreshing',
    (code) => {
      let status = 0;
      http.get('/api/cart').subscribe({ error: (e) => (status = e.status) });

      controller
        .expectOne('/api/cart')
        .flush({}, { status: code, statusText: 'x' });

      expect(status).toBe(code);
      expect(refresh).not.toHaveBeenCalled();
      expect(logout).not.toHaveBeenCalled();
    },
  );
});
