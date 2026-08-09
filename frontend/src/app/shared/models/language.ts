export type Language = 'en' | 'fa';

export interface LanguageOptionModel {
  readonly code: Language;
  readonly name: string;
  readonly nativeName: string;
  readonly rtl: boolean;
}
