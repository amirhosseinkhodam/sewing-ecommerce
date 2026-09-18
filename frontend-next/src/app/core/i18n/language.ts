import { Service, signal } from '@angular/core';
import en from './en.json';
import fa from './fa.json';

export type Language = 'en' | 'fa';

export interface LanguageOption {
  readonly code: Language;
  readonly nativeName: string;
  readonly rtl: boolean;
}

export const LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', nativeName: 'English', rtl: false },
  { code: 'fa', nativeName: 'فارسی', rtl: true },
];

const STORAGE_KEY = 'app-language';

/**
 * The dictionaries nest one group (`validation`), which callers address with
 * dotted keys such as `validation.required`. Flattening once at module load
 * keeps those keys working while making every lookup a plain map hit.
 */
function flatten(source: Record<string, unknown>, prefix = ''): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      flat[path] = value;
    } else if (value && typeof value === 'object') {
      Object.assign(flat, flatten(value as Record<string, unknown>, path));
    }
  }
  return flat;
}

const DICTIONARIES: Record<Language, Record<string, string>> = {
  en: flatten(en),
  fa: flatten(fa),
};

@Service()
export class LanguageService {
  readonly #language = signal<Language>(readStoredLanguage());

  /** Current UI language. Read in templates so switching re-renders text. */
  readonly language = this.#language.asReadonly();

  constructor() {
    // Applying `lang`/`dir` to <html> is imperative DOM sync, which is the
    // documented valid use for reacting to state here. It is done eagerly in
    // the constructor and on every change rather than via `effect` so the first
    // paint is already correct.
    this.#apply(this.#language());
  }

  set(language: Language): void {
    if (language === this.#language()) return;
    this.#language.set(language);
    this.#apply(language);
    localStorage.setItem(STORAGE_KEY, language);
  }

  toggle(): void {
    this.set(this.#language() === 'en' ? 'fa' : 'en');
  }

  /**
   * Resolves a key for the active language. Falls back to English, then to the
   * key itself, preserving the previous implementation's behavior.
   */
  translate(
    key: string,
    params?: Record<string, string | number>,
    language: Language = this.#language(),
  ): string {
    const template = DICTIONARIES[language][key] ?? DICTIONARIES.en[key] ?? key;
    return params ? interpolate(template, params) : template;
  }

  #apply(language: Language): void {
    const option = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
    document.documentElement.lang = option.code;
    document.documentElement.dir = option.rtl ? 'rtl' : 'ltr';
  }
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
}

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'en' || stored === 'fa' ? stored : 'fa';
}
