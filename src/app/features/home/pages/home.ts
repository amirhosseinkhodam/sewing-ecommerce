import { Component, inject } from '@angular/core';
import { LanguageService } from '../../../shared/services/language';

import { CardComponent } from '../../../shared/components/card';
import { ButtonComponent } from '../../../shared/components/button';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle';
import { LanguageToggleComponent } from '../../../shared/components/language-toggle';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CardComponent,
    ButtonComponent,
    ThemeToggleComponent,
    LanguageToggleComponent,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6">
      <app-card variant="bordered" [cssClass]="'max-w-md w-full'">
        <div class="flex flex-col items-center gap-6">
          <div class="flex gap-3">
            <app-theme-toggle />
            <app-language-toggle />
          </div>

          <div class="text-center">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ t('appName') }}
            </h1>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Angular 19 + Tailwind + i18n + Dark Mode
            </p>
          </div>

          <div class="flex gap-3">
            <app-button variant="primary" (buttonClick)="onGetStarted()">
              {{ t('home') }}
            </app-button>
            <app-button variant="secondary" (buttonClick)="onSettings()">
              {{ t('settings') }}
            </app-button>
          </div>
        </div>
      </app-card>
    </div>
  `,
})
export class HomeComponent {
  readonly #languageService = inject(LanguageService);

  t(key: string): string {
    return this.#languageService.translate(key);
  }

  onGetStarted(): void {
    // Add your navigation or logic here
  }

  onSettings(): void {
    // Add your navigation or logic here
  }
}
