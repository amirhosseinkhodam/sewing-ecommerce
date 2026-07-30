import { Injectable, signal, effect } from '@angular/core';
import en from '../../i18n/en.json';
import fa from '../../i18n/fa.json';

export type Language = 'en' | 'fa';

export interface LanguageOptionModel {
  code: Language;
  name: string;
  nativeName: string;
  rtl: boolean;
}

const translations: Record<Language, Record<string, string>> = { en, fa };

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly #STORAGE_KEY = 'app-language';

  readonly languages: LanguageOptionModel[] = [
    { code: 'en', name: 'English', nativeName: 'English', rtl: false },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی', rtl: true },
  ];

  currentLanguage = signal<Language>(this.#loadLanguage());

  constructor() {
    effect(() => {
      const lang = this.currentLanguage();
      const option = this.languages.find((l) => l.code === lang);
      if (option) {
        document.documentElement.lang = lang;
        document.documentElement.dir = option.rtl ? 'rtl' : 'ltr';
        localStorage.setItem(this.#STORAGE_KEY, lang);
      }
    });
  }

  translate(key: string): string {
    const lang = this.currentLanguage();
    return translations[lang]?.[key] ?? translations['en']?.[key] ?? key;
  }

  toggle(): void {
    const current = this.currentLanguage();
    const index = this.languages.findIndex((l) => l.code === current);
    const nextIndex = (index + 1) % this.languages.length;
    this.currentLanguage.set(this.languages[nextIndex].code);
  }

  getLanguageOption(code: Language): LanguageOptionModel | undefined {
    return this.languages.find((l) => l.code === code);
  }

  getCurrentLanguageOption(): LanguageOptionModel {
    return this.getLanguageOption(this.currentLanguage()) ?? this.languages[0];
  }

  #loadLanguage(): Language {
    const saved = localStorage.getItem(this.#STORAGE_KEY) as Language;
    if (saved && this.languages.some((l) => l.code === saved)) {
      const option = this.languages.find((l) => l.code === saved);
      if (option) {
        document.documentElement.lang = saved;
        document.documentElement.dir = option.rtl ? 'rtl' : 'ltr';
      }
      return saved;
    }
    return 'en';
  }
}
