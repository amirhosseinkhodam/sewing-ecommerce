import { isIranianMobile, isPersonName, passwordWeaknesses } from './validation';

describe('Auth validation', () => {
  it.each(['09123456789', '09991234567'])('accepts Iranian mobile %s', (value) => {
    expect(isIranianMobile(value)).toBe(true);
  });

  it.each([
    '',
    '+989123456789',
    '0912345678',
    '08123456789',
    '۰۹۱۲۳۴۵۶۷۸۹',
    ' 09123456789',
    '091234567890',
  ])('rejects mobile %s that differs from the backend contract', (value) => {
    expect(isIranianMobile(value)).toBe(false);
  });

  it.each(['علی', 'فاطمه', 'علی رضا', 'علی‌رضا', 'مُحَمَّد', 'Mary Jane', ' Ali '])(
    'accepts name %s',
    (value) => {
      expect(isPersonName(value)).toBe(true);
    },
  );

  it.each(['', ' ', 'A', 'A ', 'ع', '۱۲', 'علی۱۲', 'علی،', 'Test1', '<script>', '😀😀'])(
    'rejects invalid name %s',
    (value) => {
      expect(isPersonName(value)).toBe(false);
    },
  );

  it('reports all unmet password rules together', () => {
    expect(passwordWeaknesses('')).toEqual(['minLength', 'uppercase', 'lowercase', 'number']);
  });

  it.each([
    ['Abcdef1', ['minLength']],
    ['abcdefg1', ['uppercase']],
    ['ABCDEFG1', ['lowercase']],
    ['Abcdefgh', ['number']],
    ['Abcdefg1', []],
  ] as const)('reports the remaining rules for %s', (value, expected) => {
    expect(passwordWeaknesses(value)).toEqual(expected);
  });
});
