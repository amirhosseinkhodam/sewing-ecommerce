import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly #STORAGE_KEY = 'app-theme';
  isDark = signal(this.#loadTheme());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  toggle(): void {
    this.isDark.update((dark) => {
      const next = !dark;
      localStorage.setItem(this.#STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }

  #loadTheme(): boolean {
    const saved = localStorage.getItem(this.#STORAGE_KEY);
    if (saved) {
      const isDark = saved === 'dark';
      if (isDark) document.documentElement.classList.add('dark');
      return isDark;
    }
    return false;
  }
}
