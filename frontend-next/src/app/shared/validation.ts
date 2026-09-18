/**
 * Field-level validation predicates, kept as plain functions so they can be
 * used by Signal Forms `validate()` rules and unit-tested directly.
 *
 * Messages are i18n keys resolved by the `translate` pipe at render time.
 */

/** Iranian mobile number, mirroring the backend DTO regex `^09\d{9}$`. */
export function isIranianMobile(value: string): boolean {
  return /^09\d{9}$/.test(value);
}

/**
 * A person's name in Persian/Arabic or Latin letters, at least 2 characters.
 * Spaces are allowed so compound names pass.
 */
export function isPersonName(value: string): boolean {
  const trimmed = value.trim();
  const letters = trimmed.match(/\p{L}/gu) ?? [];
  return (
    letters.length >= 2 &&
    /^[\p{L}\p{M} \u200c]+$/u.test(trimmed) &&
    /^[\p{Script_Extensions=Arabic}a-zA-Z \u200c]+$/u.test(trimmed)
  );
}

export type PasswordWeakness = 'minLength' | 'uppercase' | 'lowercase' | 'number';

/**
 * Returns every unmet password rule, so the UI can list them all at once
 * rather than revealing one per submit.
 */
export function passwordWeaknesses(value: string): PasswordWeakness[] {
  const weaknesses: PasswordWeakness[] = [];
  if (value.length < 8) weaknesses.push('minLength');
  if (!/[A-Z]/.test(value)) weaknesses.push('uppercase');
  if (!/[a-z]/.test(value)) weaknesses.push('lowercase');
  if (!/\d/.test(value)) weaknesses.push('number');
  return weaknesses;
}
