import { Component, inject } from '@angular/core';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Sun01Icon, Moon02Icon } from '@hugeicons/core-free-icons';
import { ThemeService } from '../services/theme';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [HugeiconsIconComponent],
  template: `
    <button
      class="flex items-center bg-transparent border-0 p-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      (click)="theme.toggle()"
      [class.dark]="theme.isDark()"
      role="switch"
      [attr.aria-checked]="theme.isDark()"
      aria-label="Toggle dark mode"
    >
      <span
        class="relative flex items-center w-16 h-9 rounded-full bg-gradient-to-br from-sky-300 to-sky-400 dark:from-slate-800 dark:to-slate-700 transition-colors duration-300 ease-in-out overflow-hidden"
      >
        <span
          class="absolute flex items-center justify-center w-4.5 h-4.5 z-10 transition-all duration-300 ease-in-out top-2 left-1.5 text-amber-400 opacity-100 rotate-0 scale-100 dark:opacity-0 dark:rotate-90 dark:scale-50"
        >
          <hugeicons-icon
            [icon]="icons.Sun01Icon"
            [size]="18"
            color="currentColor"
            [strokeWidth]="1.5"
          />
        </span>
        <span
          class="absolute flex items-center justify-center w-4.5 h-4.5 z-10 transition-all duration-300 ease-in-out top-2 right-1.5 text-slate-200 opacity-0 -rotate-90 scale-50 dark:opacity-100 dark:rotate-0 dark:scale-100"
        >
          <hugeicons-icon
            [icon]="icons.Moon02Icon"
            [size]="18"
            color="currentColor"
            [strokeWidth]="1.5"
          />
        </span>
        <span
          class="absolute top-1.5 left-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out dark:translate-x-8 dark:bg-slate-600 hover:shadow-md"
        ></span>
      </span>
    </button>
  `,
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);

  readonly icons = { Sun01Icon, Moon02Icon };
}
