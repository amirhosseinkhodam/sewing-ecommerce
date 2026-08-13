import { randomUUID } from 'crypto';

const PERSIAN_TO_LATIN: Record<string, string> = {
  آ: 'a',
  ا: 'a',
  ب: 'b',
  پ: 'p',
  ت: 't',
  ث: 's',
  ج: 'j',
  چ: 'ch',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'z',
  ر: 'r',
  ز: 'z',
  ژ: 'zh',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'z',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'gh',
  ک: 'k',
  گ: 'g',
  ل: 'l',
  م: 'm',
  ن: 'n',
  و: 'v',
  ه: 'h',
  ی: 'y',
  ئ: 'y',
  ء: '',
  أ: 'a',
  إ: 'a',
  ؤ: 'v',
  ة: 'h',
  ك: 'k',
  ي: 'y',
};

export function slugify(input: string, fallbackPrefix: string): string {
  const transliterated = input
    .toLowerCase()
    .split('')
    .map((char) => PERSIAN_TO_LATIN[char] ?? char)
    .join('');
  const base = transliterated
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (base) return base;
  return `${fallbackPrefix}-${randomUUID().slice(0, 8)}`;
}
