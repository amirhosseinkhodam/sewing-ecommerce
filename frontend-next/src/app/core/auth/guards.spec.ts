import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { USER_ROLES } from '@domain/const/user-roles';
import { adminGuard, authGuard } from './guards';
import { AuthSessionStore } from './session';

@Component({ template: 'Public page' })
class PublicPage {}

@Component({ template: 'Protected page' })
class ProtectedPage {}

describe('Auth guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: PublicPage },
          { path: 'login', component: PublicPage },
          { path: 'profile', component: ProtectedPage, canActivate: [authGuard] },
          { path: 'admin', component: ProtectedPage, canActivate: [adminGuard] },
        ]),
      ],
    });
  });

  afterEach(() => localStorage.clear());

  it('preserves the entire destination when redirecting an anonymous user', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile?tab=details#contact', PublicPage);
    const router = TestBed.inject(Router);
    expect(router.parseUrl(router.url).queryParams['returnUrl']).toBe(
      '/profile?tab=details#contact',
    );
    expect(router.url.startsWith('/login?')).toBe(true);
  });

  it('allows an authenticated customer into their profile', async () => {
    TestBed.inject(AuthSessionStore).setTokens('access', 'refresh');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile', ProtectedPage);
  });

  it('treats an empty stored access token as anonymous', async () => {
    localStorage.setItem('accessToken', '');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile', PublicPage);
    expect(TestBed.inject(Router).url.startsWith('/login?')).toBe(true);
  });

  it.each([USER_ROLES.CUSTOMER, USER_ROLES.ADMIN])(
    'checks the %s role before admitting an authenticated user to admin',
    async (role) => {
      const session = TestBed.inject(AuthSessionStore);
      session.setTokens('access', 'refresh');
      session.setUser({
        id: 'user-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '09123456789',
        role,
      });
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/admin');
      expect(TestBed.inject(Router).url).toBe(role === USER_ROLES.ADMIN ? '/admin' : '/');
    },
  );

  it('rejects an anonymous admin route', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin', PublicPage);
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
