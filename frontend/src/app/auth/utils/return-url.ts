const AUTH_PATHS = ['/login', '/register'];

/**
 * Accepts only same-site absolute paths so a crafted `?returnUrl=` cannot
 * send a freshly authenticated user to another origin or back into auth.
 */
export function safeReturnUrl(
  value: string | null | undefined,
): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return undefined;
  }
  if (value.includes('\\')) return undefined;
  const path = value.split(/[?#]/)[0];
  return AUTH_PATHS.includes(path) ? undefined : value;
}
