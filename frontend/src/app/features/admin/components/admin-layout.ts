import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { BoxIcon, Tag01Icon, Settings01Icon } from '@hugeicons/core-free-icons';
import { TranslatePipe } from '@shared/pipes/translate';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    HugeiconsIconComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-8 lg:flex-row">
        <aside class="shrink-0 lg:w-56">
          <nav class="flex flex-row gap-1 overflow-x-auto lg:flex-col">
            <a
              routerLink="/admin/products"
              routerLinkActive="!bg-slate-100 dark:!bg-slate-700 !text-slate-900 dark:!text-slate-100"
              class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <hugeicons-icon
                [icon]="icons.BoxIcon"
                [size]="18"
                color="currentColor"
                [strokeWidth]="1.5"
              />
              {{ 'manageProducts' | translate }}
            </a>
            <a
              routerLink="/admin/categories"
              routerLinkActive="!bg-slate-100 dark:!bg-slate-700 !text-slate-900 dark:!text-slate-100"
              class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <hugeicons-icon
                [icon]="icons.Tag01Icon"
                [size]="18"
                color="currentColor"
                [strokeWidth]="1.5"
              />
              {{ 'manageCategories' | translate }}
            </a>
            <a
              routerLink="/settings"
              class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 dark:text-slate-500 pointer-events-none"
            >
              <hugeicons-icon
                [icon]="icons.Settings01Icon"
                [size]="18"
                color="currentColor"
                [strokeWidth]="1.5"
              />
              {{ 'settings' | translate }}
            </a>
          </nav>
        </aside>

        <div class="min-w-0 flex-1">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  readonly icons = { BoxIcon, Tag01Icon, Settings01Icon };
}
