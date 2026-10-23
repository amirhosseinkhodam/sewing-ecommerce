import { normalizeDigits } from '@shared/utils/normalize-digits';

describe('normalizeDigits', () => {
  it('converts Persian digits', () => {
    expect(normalizeDigits('۰۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789');
  });

  it('converts Arabic-Indic digits', () => {
    expect(normalizeDigits('٠٩١٢٣٤٥٦٧٨٩')).toBe('09123456789');
  });

  it('converts Arabic decimal and thousands separators', () => {
    expect(normalizeDigits('١٢٬٣٤٥٫٦٧')).toBe('12,345.67');
  });

  it('leaves ASCII digits and other text untouched', () => {
    expect(normalizeDigits('abc 123 سلام')).toBe('abc 123 سلام');
  });

  it('handles mixed scripts and the empty string', () => {
    expect(normalizeDigits('۱2٣')).toBe('123');
    expect(normalizeDigits('')).toBe('');
  });
});
