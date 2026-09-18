import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { USER_ROLES } from '@domain/const/user-roles';
import { authInterceptor } from './auth-interceptor';
import { AuthSessionStore } from './session';

const tokens = {
  accessToken: 'new-access',
  refreshToken: 'new-refresh',
  user: {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '09123456789',
    role: USER_ROLES.CUSTOMER,
  },
};
const unauthorized = { status: 401, statusText: 'Unauthorized' };

describe('authInterceptor', () => {
  let http: HttpClient;
  let requests: HttpTestingController;
  let session: InstanceType<typeof AuthSessionStore>;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    session = TestBed.inject(AuthSessionStore);
    session.setTokens('old-access', 'old-refresh');
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    requests.verify();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shares one refresh for concurrent 401s and retries each original request', () => {
    const received = vi.fn();
    http.get('/api/cart').subscribe(received);
    http.get('/api/addresses').subscribe(received);
    for (const url of ['/api/cart', '/api/addresses']) {
      const request = requests.expectOne(url);
      expect(request.request.headers.get('Authorization')).toBe('Bearer old-access');
      request.flush({}, unauthorized);
    }
    const refresh = requests.expectOne('/api/auth/refresh');
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.body).toEqual({ refreshToken: 'old-refresh' });
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush(tokens);

    for (const url of ['/api/cart', '/api/addresses']) {
      const request = requests.expectOne(url);
      expect(request.request.headers.get('Authorization')).toBe('Bearer new-access');
      request.flush({ ok: true });
    }
    expect(received).toHaveBeenCalledTimes(2);
    expect(session.user()).toEqual(tokens.user);
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
  });

  it('reuses a rotated token for a delayed 401 without a second refresh', () => {
    http.get('/api/cart').subscribe();
    http.get('/api/addresses').subscribe();
    requests.expectOne('/api/cart').flush({}, unauthorized);
    requests.expectOne('/api/auth/refresh').flush(tokens);
    requests.expectOne('/api/cart').flush({});
    requests.expectOne('/api/addresses').flush({}, unauthorized);
    const retry = requests.expectOne('/api/addresses');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush({});
    requests.expectNone('/api/auth/refresh');
  });

  it('clears a rejected session and redirects once for concurrent failures', () => {
    const failed = vi.fn();
    for (const url of ['/api/cart', '/api/addresses']) {
      http.get(url).subscribe({ error: failed });
      requests.expectOne(url).flush({}, unauthorized);
    }
    requests.expectOne('/api/auth/refresh').flush({}, unauthorized);
    expect(failed).toHaveBeenCalledTimes(2);
    expect(session.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/');
  });

  it.each([403, 500])('preserves the session when the retried request returns %i', (status) => {
    const failed = vi.fn();
    http.get('/api/cart').subscribe({ error: failed });
    requests.expectOne('/api/cart').flush({}, unauthorized);
    requests.expectOne('/api/auth/refresh').flush(tokens);
    requests
      .expectOne('/api/cart')
      .flush({ message: 'Retry failed' }, { status, statusText: 'Error' });
    expect(failed.mock.calls[0][0]).toMatchObject({ status });
    expect(session.accessToken()).toBe('new-access');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not refresh a second time when the retried request returns 401', () => {
    const failed = vi.fn();
    http.get('/api/cart').subscribe({ error: failed });
    requests.expectOne('/api/cart').flush({}, unauthorized);
    requests.expectOne('/api/auth/refresh').flush(tokens);
    requests.expectOne('/api/cart').flush({}, unauthorized);
    requests.expectNone('/api/auth/refresh');
    expect(failed).toHaveBeenCalledOnce();
    expect(session.isAuthenticated()).toBe(false);
  });

  it.each([
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh?source=test',
    'https://example.com/api/cart',
    '/uploads/image.png',
  ])('does not attach credentials or refresh for %s', (url) => {
    const failed = vi.fn();
    http.get(url).subscribe({ error: failed });
    const request = requests.expectOne(url);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({}, unauthorized);
    requests.expectNone('/api/auth/refresh');
    expect(failed).toHaveBeenCalledOnce();
    expect(session.accessToken()).toBe('old-access');
  });

  it('does not restore a session that was cleared during refresh', () => {
    const failed = vi.fn();
    http.get('/api/cart').subscribe({ error: failed });
    requests.expectOne('/api/cart').flush({}, unauthorized);
    session.clear();
    requests.expectOne('/api/auth/refresh').flush(tokens);
    requests.expectNone('/api/cart');
    expect(failed).toHaveBeenCalledOnce();
    expect(session.isAuthenticated()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not clear a replacement session when an old refresh fails', () => {
    http.get('/api/cart').subscribe({ error: () => undefined });
    requests.expectOne('/api/cart').flush({}, unauthorized);
    session.setTokens('replacement-access', 'replacement-refresh');
    requests.expectOne('/api/auth/refresh').flush({}, unauthorized);
    expect(session.accessToken()).toBe('replacement-access');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('releases a cancelled refresh so a later request can try again', () => {
    const subscription = http.get('/api/cart').subscribe();
    requests.expectOne('/api/cart').flush({}, unauthorized);
    const cancelled = requests.expectOne('/api/auth/refresh');
    subscription.unsubscribe();
    expect(cancelled.cancelled).toBe(true);
    http.get('/api/cart').subscribe();
    requests.expectOne('/api/cart').flush({}, unauthorized);
    requests.expectOne('/api/auth/refresh').flush(tokens);
    requests.expectOne('/api/cart').flush({});
  });

  it('expires a token-only session instead of leaving it authenticated after a 401', () => {
    session.setTokens('old-access', '');
    http.get('/api/cart').subscribe({ error: () => undefined });
    requests.expectOne('/api/cart').flush({}, unauthorized);
    requests.expectNone('/api/auth/refresh');
    expect(session.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledOnce();
  });

  it('passes anonymous 401s through without redirecting', () => {
    session.clear();
    const failed = vi.fn();
    http.get('/api/catalog').subscribe({ error: failed });
    requests.expectOne('/api/catalog').flush({}, unauthorized);
    expect(failed.mock.calls[0][0]).toBeInstanceOf(HttpErrorResponse);
    expect(navigate).not.toHaveBeenCalled();
  });
});
