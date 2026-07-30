import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../services/language';
import { ThemeToggleComponent } from './theme-toggle';
import { LanguageToggleComponent } from './language-toggle';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, ThemeToggleComponent, LanguageToggleComponent],
  template: `
    <nav
      class="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-8">
            <a
              routerLink="/"
              class="text-xl font-bold text-slate-900 dark:text-white"
            >
              {{ t('appName') }}
            </a>

            <div class="hidden md:flex items-center gap-6">
              <a
                routerLink="/products"
                class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {{ t('products') }}
              </a>
              <a
                routerLink="/portfolio"
                class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {{ t('portfolio') }}
              </a>
              <a
                routerLink="/about"
                class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {{ t('about') }}
              </a>
              <a
                routerLink="/contact"
                class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {{ t('contact') }}
              </a>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <app-theme-toggle />
            <app-language-toggle />

            <a
              routerLink="/cart"
              class="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              [attr.aria-label]="t('cart')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              @if (cartCount() > 0) {
                <span
                  class="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full"
                >
                  {{ cartCount() > 99 ? '99+' : cartCount() }}
                </span>
              }
            </a>

            <button
              type="button"
              class="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              (click)="mobileMenuOpen.set(!mobileMenuOpen())"
              [attr.aria-label]="mobileMenuOpen() ? 'Close menu' : 'Open menu'"
            >
              @if (mobileMenuOpen()) {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              } @else {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              }
            </button>
          </div>
        </div>

        @if (mobileMenuOpen()) {
          <div class="md:hidden pb-4 border-t border-slate-200 dark:border-slate-700">
            <div class="flex flex-col gap-1 pt-3">
              <a
                routerLink="/products"
                class="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                (click)="mobileMenuOpen.set(false)"
              >
                {{ t('products') }}
              </a>
              <a
                routerLink="/portfolio"
                class="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                (click)="mobileMenuOpen.set(false)"
              >
                {{ t('portfolio') }}
              </a>
              <a
                routerLink="/about"
                class="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                (click)="mobileMenuOpen.set(false)"
              >
                {{ t('about') }}
              </a>
              <a
                routerLink="/contact"
                class="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                (click)="mobileMenuOpen.set(false)"
              >
                {{ t('contact') }}
              </a>
            </div>
          </div>
        }
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  readonly #languageService = inject(LanguageService);

  readonly mobileMenuOpen = signal(false);
  readonly cartCount = signal(0);

  t(key: string): string {
    return this.#languageService.translate(key);
  }
}
