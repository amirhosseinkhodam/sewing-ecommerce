import { safeReturnUrl } from '@auth/utils/return-url';

describe('safeReturnUrl', () => {
  it.each(['/', '/orders', '/orders/42?payment=SUCCESS', '/products#top'])(
    'accepts the same-site path %s',
    (url) => {
      expect(safeReturnUrl(url)).toBe(url);
    },
  );

  it.each([
    ['empty', ''],
    ['null', null],
    ['undefined', undefined],
    ['a relative path', 'orders'],
    ['an absolute URL', 'https://evil.example/'],
    ['a protocol-relative URL', '//evil.example'],
    ['a backslash trick', '/\\evil.example'],
    ['javascript:', 'javascript:alert(1)'],
  ])('rejects %s', (_label, url) => {
    expect(safeReturnUrl(url)).toBeUndefined();
  });

  it.each(['/login', '/register', '/login?returnUrl=%2F', '/register#x'])(
    'refuses to bounce back into auth: %s',
    (url) => {
      expect(safeReturnUrl(url)).toBeUndefined();
    },
  );

  it('allows paths that merely start like an auth page', () => {
    expect(safeReturnUrl('/login-help')).toBe('/login-help');
  });
});
