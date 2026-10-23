import en from '@i18n/en.json';
import fa from '@i18n/fa.json';

function leafKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function leaves(value: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const walk = (node: unknown, path: string) => {
    if (typeof node === 'object' && node !== null) {
      for (const [key, child] of Object.entries(node)) {
        walk(child, path ? `${path}.${key}` : key);
      }
    } else {
      out[path] = node;
    }
  };
  walk(value, '');
  return out;
}

describe('translation files', () => {
  const enKeys = leafKeys(en).sort();
  const faKeys = leafKeys(fa).sort();

  it('have exactly the same keys in English and Persian', () => {
    expect(faKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
    expect(enKeys.filter((k) => !faKeys.includes(k))).toEqual([]);
  });

  it('have no empty values', () => {
    for (const file of [en, fa]) {
      const empty = Object.entries(leaves(file)).filter(
        ([, v]) => typeof v !== 'string' || v.trim() === '',
      );
      expect(empty).toEqual([]);
    }
  });

  it('use the same {{placeholders}} in both languages', () => {
    const placeholders = (text: unknown) =>
      String(text)
        .match(/\{\{\w+\}\}/g)
        ?.sort() ?? [];
    const enLeaves = leaves(en);
    const faLeaves = leaves(fa);

    const mismatched = Object.keys(enLeaves).filter(
      (key) =>
        JSON.stringify(placeholders(enLeaves[key])) !==
        JSON.stringify(placeholders(faLeaves[key])),
    );

    expect(mismatched).toEqual([]);
  });

  it('translate every message the API can return', () => {
    const apiKeys = enKeys.filter((k) => k.startsWith('apiErrors.'));
    expect(apiKeys.length).toBeGreaterThan(20);
  });
});
