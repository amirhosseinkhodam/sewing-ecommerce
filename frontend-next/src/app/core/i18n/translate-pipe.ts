import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService, type Language } from './language';

@Pipe({ name: 'translate' })
export class TranslatePipe implements PipeTransform {
  readonly #i18n = inject(LanguageService);

  transform(key: string, language: Language, params?: Record<string, string | number>): string {
    return this.#i18n.translate(key, params, language);
  }
}
