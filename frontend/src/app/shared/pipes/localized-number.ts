import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language';

@Pipe({ name: 'localizedNumber', standalone: true, pure: false })
export class LocalizedNumberPipe implements PipeTransform {
  readonly #languageService = inject(LanguageService);

  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(num)) return String(value);
    const locale =
      this.#languageService.currentLanguage() === 'fa' ? 'fa-IR' : 'en-US';
    return num.toLocaleString(locale);
  }
}
