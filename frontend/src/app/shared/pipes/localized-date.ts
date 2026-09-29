import { Pipe, PipeTransform, inject } from '@angular/core';
import { format } from 'date-fns/format';
import { format as formatJalali } from 'date-fns-jalali/format';
import { LanguageService } from '../services/language';

@Pipe({ name: 'localizedDate' })
export class LocalizedDatePipe implements PipeTransform {
  readonly #languageService = inject(LanguageService);

  transform(
    value: string | null | undefined,
    formatStr: string = 'yyyy/MM/dd HH:mm',
  ): string {
    if (!value) return '';
    const date = new Date(value);
    return this.#languageService.currentLanguage() === 'fa'
      ? formatJalali(date, formatStr)
      : format(date, formatStr);
  }
}
