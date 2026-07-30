import { Pipe, PipeTransform, inject } from '@angular/core';
import { format } from 'date-fns';
import { formatDate } from 'date-fns-jalali';
import { LanguageService } from '../services/language';

@Pipe({ name: 'localizedDate', standalone: true, pure: false })
export class LocalizedDatePipe implements PipeTransform {
  readonly #languageService = inject(LanguageService);

  transform(
    value: string | null | undefined,
    formatStr: string = 'yyyy/MM/dd HH:mm',
  ): string {
    if (!value) return '';
    const date = new Date(value);
    return this.#languageService.currentLanguage() === 'fa'
      ? formatDate(date, formatStr)
      : format(date, formatStr);
  }
}
