import { Service, signal } from '@angular/core';

const STORAGE_KEY = 'app-theme';

/**
 * Light/dark theme, persisted per user choice (not `prefers-color-scheme`).
 *
 * Toggling the `.dark` class on <html> is the single switch for the whole app:
 * `material-theme.scss` keys `color-scheme` off it — and Material 22 emits every
 * color as `light-dark(light, dark)` — while `styles.css` declares Tailwind's
 * `dark:` variant against the same class.
 */
@Service()
export class ThemeService {
  readonly #isDark = signal(readStoredTheme());

  readonly isDark = this.#isDark.asReadonly();

  constructor() {
    this.#apply(this.#isDark());
  }

  toggle(): void {
    const next = !this.#isDark();
    this.#isDark.set(next);
    this.#apply(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  }

  #apply(isDark: boolean): void {
    document.documentElement.classList.toggle('dark', isDark);
  }
}

function readStoredTheme(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'dark';
}
