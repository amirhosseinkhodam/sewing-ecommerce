import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language';

/**
 * Translates a dictionary key.
 *
 * Deliberately a **pure** pipe. It reads the `language` signal inside
 * `transform`, which registers the consuming template as a reactive consumer of
 * that signal — so a language change re-evaluates exactly the affected
 * bindings. The previous implementation was `pure: false`, which re-ran for
 * every interpolation on every change detection cycle and needed a manual
 * `effect` + `markForCheck` to work at all.
 */
@Pipe({ name: 'translate' })
export class TranslatePipe implements PipeTransform {
  readonly #i18n = inject(LanguageService);

  transform(key: string, params?: Record<string, string | number>): string {
    this.#i18n.language(); // establishes the reactive dependency
    return this.#i18n.translate(key, params);
  }
}
