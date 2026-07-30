import { Component, inject } from '@angular/core';
import { ThemeService } from '../services/theme';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
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
          class="absolute flex items-center justify-center w-[18px] h-[18px] z-10 transition-all duration-300 ease-in-out top-[9px] left-[7px] text-amber-400 opacity-100 rotate-0 scale-100 dark:opacity-0 dark:rotate-90 dark:scale-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="18"
            height="18"
          >
            <path
              d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-3a1 1 0 001-1V1a1 1 0 00-2 0v2a1 1 0 001 1zm0 18a1 1 0 00-1 1v2a1 1 0 002 0v-2a1 1 0 00-1-1zm9-9a1 1 0 00-1-1h-2a1 1 0 000 2h2a1 1 0 001-1zM4 12a1 1 0 00-1-1H1a1 1 0 000 2h2a1 1 0 001-1zm14.07-6.36a1 1 0 00.7-.29l1.42-1.42a1 1 0 10-1.42-1.42l-1.42 1.42a1 1 0 00.72 1.71zM5.64 18.36a1 1 0 00-.7.29l-1.42 1.42a1 1 0 101.42 1.42l1.42-1.42a1 1 0 00-.72-1.71zM19.78 18.36a1 1 0 00.71-.29 1 1 0 000-1.42l-1.42-1.42a1 1 0 10-1.42 1.42l1.42 1.42a1 1 0 00.71.29zM5.64 5.64a1 1 0 00-.71-.29 1 1 0 00-.71.29l-1.42 1.42a1 1 0 101.42 1.42l1.42-1.42a1 1 0 000-1.42z"
            />
          </svg>
        </span>
        <span
          class="absolute flex items-center justify-center w-[18px] h-[18px] z-10 transition-all duration-300 ease-in-out top-[9px] right-[7px] text-slate-200 opacity-0 -rotate-90 scale-50 dark:opacity-100 dark:rotate-0 dark:scale-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="18"
            height="18"
          >
            <path
              d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.14 8.59 8.59 0 01.25-2A1 1 0 008 2.36a10.14 10.14 0 1014 11.69 1 1 0 00-.35-1.05z"
            />
          </svg>
        </span>
        <span
          class="absolute top-[6px] left-[4px] w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out dark:translate-x-8 dark:bg-slate-600 hover:shadow-md"
        ></span>
      </span>
    </button>
  `,
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
