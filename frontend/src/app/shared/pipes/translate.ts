import {
  ChangeDetectorRef,
  DestroyRef,
  Pipe,
  PipeTransform,
  effect,
  inject,
} from "@angular/core";
import { LanguageService } from "../services/language";

@Pipe({ name: "translate", standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  readonly #languageService = inject(LanguageService);
  #lastLang = this.#languageService.currentLanguage();

  constructor() {
    const cdr = inject(ChangeDetectorRef);
    const destroyRef = inject(DestroyRef);
    const e = effect(() => {
      const lang = this.#languageService.currentLanguage();
      if (lang !== this.#lastLang) {
        this.#lastLang = lang;
        cdr.markForCheck();
      }
    });
    destroyRef.onDestroy(() => e.destroy());
  }

  transform(key: string, params?: Record<string, unknown>): string {
    let result = this.#languageService.translate(key);
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(
          new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"),
          String(paramValue),
        );
      }
    }
    return result;
  }
}
