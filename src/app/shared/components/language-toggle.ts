import { Component, inject } from '@angular/core';
import { LanguageService, LanguageOptionModel } from '../services/language';
import { ThemeService } from '../services/theme';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  template: `
    <button
      class="inline-flex items-center gap-2 px-3 py-2 sm:px-3 sm:py-2 p-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer whitespace-nowrap transition-all duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 hover:bg-slate-200 dark:hover:bg-slate-700 group"
      (click)="toggle()"
      [class.dark]="theme.isDark()"
      [attr.aria-label]="'Switch language (' + currentLanguage.nativeName + ')'"
      type="button"
    >
      <span class="hidden sm:inline">{{ currentLanguage.nativeName }}</span>
      <span
        class="flex items-center justify-center text-slate-500 dark:text-slate-400 transition-transform duration-300 ease-in-out group-hover:rotate-180"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          width="18"
          height="18"
        >
          <path
            d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"
          />
        </svg>
      </span>
    </button>
  `,
})
export class LanguageToggleComponent {
  readonly #languageService = inject(LanguageService);
  readonly theme = inject(ThemeService);

  get currentLanguage(): LanguageOptionModel {
    return this.#languageService.getCurrentLanguageOption();
  }

  toggle(): void {
    this.#languageService.toggle();
  }
}
