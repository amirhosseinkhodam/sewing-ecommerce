import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import BoxIcon from '@hugeicons/core-free-icons/BoxIcon';
import DashboardSquare01Icon from '@hugeicons/core-free-icons/DashboardSquare01Icon';
import Image01Icon from '@hugeicons/core-free-icons/Image01Icon';
import Mail01Icon from '@hugeicons/core-free-icons/Mail01Icon';
import Settings01Icon from '@hugeicons/core-free-icons/Settings01Icon';
import ShoppingBag01Icon from '@hugeicons/core-free-icons/ShoppingBag01Icon';
import Tag01Icon from '@hugeicons/core-free-icons/Tag01Icon';
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon';

import { TranslatePipe } from '@shared/pipes/translate';

@Component({
  selector: 'app-admin-layout',
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
              routerLink="/admin"
              [routerLinkActiveOptions]="{ exact: true }"
              routerLinkActive="!bg-slate-100 dark:!bg-slate-700 !text-slate-900 dark:!text-slate-100"
              class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <hugeicons-icon
                [icon]="icons.DashboardSquare01Icon"
                [size]="18"
                color="currentColor"
                [strokeWidth]="1.5"
              />
              {{ 'dashboard' | translate }}
            </a>
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
              routerLink="/admin/orders"
              routerLinkActive="!bg-slate-100 dark:!bg-slate-700 !text-slate-900 dark:!text-slate-100"
              class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <hugeicons-icon
                [icon]="icons.ShoppingBag01Icon"
                [size]="18"
                color="currentColor"
                [strokeWidth]="1.5"
              />
              {{ 'manageOrders' | translate }}
            </a>
            <a
              routerLink="/admin/portfolio"
              routerLinkActive="!bg-slate-100 dark:!bg-slate-700 !text-slate-900 dark:!text-slate-100"
              class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <hugeicons-icon
                [icon]="icons.Image01Icon"
                [size]="18"
                color="currentColor"
                [strokeWidth]="1.5"
              />
              {{ 'managePortfolio' | translate }}
            </a>
            <a
              routerLink="/admin/messages"
              routerLinkActive="!bg-slate-100 dark:!bg-slate-700 !text-slate-900 dark:!text-slate-100"
              class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <hugeicons-icon
                [icon]="icons.Mail01Icon"
                [size]="18"
                color="currentColor"
                [strokeWidth]="1.5"
              />
              {{ 'messages' | translate }}
            </a>
            <a
              routerLink="/admin/customers"
              routerLinkActive="!bg-slate-100 dark:!bg-slate-700 !text-slate-900 dark:!text-slate-100"
              class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <hugeicons-icon
                [icon]="icons.UserGroupIcon"
                [size]="18"
                color="currentColor"
                [strokeWidth]="1.5"
              />
              {{ 'manageCustomers' | translate }}
            </a>
            <a
              routerLink="/admin/settings"
              routerLinkActive="!bg-slate-100 dark:!bg-slate-700 !text-slate-900 dark:!text-slate-100"
              class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
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
  readonly icons = {
    BoxIcon,
    DashboardSquare01Icon,
    Tag01Icon,
    Settings01Icon,
    ShoppingBag01Icon,
    Image01Icon,
    Mail01Icon,
    UserGroupIcon,
  };
}
