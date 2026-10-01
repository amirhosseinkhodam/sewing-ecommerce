import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { AdminOrderModel } from '@domain/models/order';
import BoxIcon from '@hugeicons/core-free-icons/BoxIcon';
import Image01Icon from '@hugeicons/core-free-icons/Image01Icon';
import Mail01Icon from '@hugeicons/core-free-icons/Mail01Icon';
import MoneyBag02Icon from '@hugeicons/core-free-icons/MoneyBag02Icon';
import ShoppingBag01Icon from '@hugeicons/core-free-icons/ShoppingBag01Icon';
import Tag01Icon from '@hugeicons/core-free-icons/Tag01Icon';
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { EmptyStateComponent } from '@shared/components/empty-state';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { SelectComponent } from '@shared/components/select';
import type { SelectOption } from '@shared/models/select';
import { LocalizedDatePipe } from '@shared/pipes/localized-date';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { LanguageService } from '@shared/services/language';
import {
  ORDER_STATUS_KEYS,
  OrderStatusBadgeComponent,
} from '../../orders/components/order-status-badge';
import { StatCardComponent } from '../components/stat-card';
import { TrendChartComponent } from '../components/trend-chart';
import { AdminDashboardStore } from '../store/dashboard';

/** Windows the range picker offers, in days. */
const RANGE_DAYS = [7, 30, 90] as const;

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    OrderStatusBadgeComponent,
    SelectComponent,
    StatCardComponent,
    TranslatePipe,
    TrendChartComponent,
  ],
  providers: [AdminDashboardStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {{ 'dashboard' | translate }}
        </h1>
        <div class="w-full sm:w-48">
          <app-select
            [options]="rangeOptions()"
            [value]="store.days()"
            [clearable]="false"
            (selectChange)="onRangeChange($event)"
          />
        </div>
      </div>

      @if (store.loading()) {
        <div class="flex justify-center py-20">
          <app-loading-spinner
            size="lg"
            cssClass="text-slate-400 dark:text-slate-500"
          />
        </div>
      } @else if (store.error()) {
        <app-empty-state
          titleKey="couldNotLoadData"
          actionLabelKey="refresh"
          (actionClick)="store.reload()"
        />
      } @else if (store.stats(); as stats) {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <app-stat-card
            labelKey="totalRevenue"
            tone="green"
            suffixKey="currencyToman"
            [value]="stats.totalRevenue"
            [icon]="icons.MoneyBag02Icon"
          />
          <app-stat-card
            labelKey="totalOrders"
            tone="blue"
            [value]="stats.totalOrders"
            [icon]="icons.ShoppingBag01Icon"
          />
          <app-stat-card
            labelKey="totalCustomers"
            tone="purple"
            [value]="stats.totalCustomers"
            [icon]="icons.UserGroupIcon"
          />
          <app-stat-card
            labelKey="unreadMessages"
            tone="amber"
            [value]="stats.unreadMessages"
            [icon]="icons.Mail01Icon"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <app-stat-card
            labelKey="totalProducts"
            [value]="stats.totalProducts"
            [icon]="icons.BoxIcon"
          />
          <app-stat-card
            labelKey="categories"
            [value]="stats.totalCategories"
            [icon]="icons.Tag01Icon"
          />
          <app-stat-card
            labelKey="portfolio"
            [value]="stats.totalPortfolioItems"
            [icon]="icons.Image01Icon"
          />
        </div>

        <app-card variant="bordered">
          <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2
              class="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {{ 'ordersTrend' | translate }}
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              {{ stats.ordersInRange | localizedNumber }}
              {{ 'orders' | translate }}
              &middot;
              {{ stats.rangeRevenue | localizedNumber }}
              {{ 'currencyToman' | translate }}
            </p>
          </div>
          <app-trend-chart [points]="stats.trend" />
        </app-card>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <app-card variant="bordered">
            <h2
              class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {{ 'ordersByStatus' | translate }}
            </h2>
            <div class="flex flex-col gap-2">
              @for (row of stats.ordersByStatus; track row.status) {
                <div class="flex items-center justify-between gap-3">
                  <app-order-status-badge [status]="row.status" />
                  <span
                    class="text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    {{ row.count | localizedNumber }}
                  </span>
                </div>
              }
            </div>
          </app-card>

          <app-card variant="bordered">
            <h2
              class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {{ 'paymentsByStatus' | translate }}
            </h2>
            <div class="flex flex-col gap-2">
              @for (row of stats.paymentsByStatus; track row.paymentStatus) {
                <div class="flex items-center justify-between gap-3">
                  <app-order-status-badge [paymentStatus]="row.paymentStatus" />
                  <span
                    class="text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    {{ row.count | localizedNumber }}
                  </span>
                </div>
              }
            </div>
          </app-card>
        </div>

        <app-card variant="bordered" padding="none">
          <div
            class="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 px-4 py-3"
          >
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">
              {{ 'recentOrders' | translate }}
            </h2>
            <app-button variant="ghost" size="sm" (buttonClick)="onAllOrders()">
              {{ 'viewAll' | translate }}
            </app-button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <tbody>
                @for (order of store.recentOrders(); track order.id) {
                  <tr
                    class="cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                    (click)="onOpenOrder(order)"
                  >
                    <td
                      class="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400"
                    >
                      {{ shortId(order.id) }}
                    </td>
                    <td
                      class="px-4 py-3 font-medium text-slate-900 dark:text-slate-100"
                    >
                      {{ order.customer.firstName }}
                      {{ order.customer.lastName }}
                    </td>
                    <td class="px-4 py-3">
                      <app-order-status-badge [status]="order.status" />
                    </td>
                    <td
                      class="px-4 py-3 text-end font-medium text-slate-900 dark:text-slate-100"
                    >
                      {{ order.totalAmount | localizedNumber }}
                      <span
                        class="text-xs font-normal text-slate-500 dark:text-slate-400"
                      >
                        {{ 'currencyToman' | translate }}
                      </span>
                    </td>
                    <td
                      class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400"
                    >
                      {{ order.createdAt | localizedDate }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td
                      colspan="5"
                      class="px-4 py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      {{ 'noOrders' | translate }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-card>
      }
    </div>
  `,
})
export class AdminDashboardComponent {
  readonly store = inject(AdminDashboardStore);

  readonly icons = {
    BoxIcon,
    Image01Icon,
    Mail01Icon,
    MoneyBag02Icon,
    ShoppingBag01Icon,
    Tag01Icon,
    UserGroupIcon,
  };
  readonly statusKeys = ORDER_STATUS_KEYS;

  readonly #router = inject(Router);
  readonly #language = inject(LanguageService);

  /**
   * `LanguageService.translate` has no interpolation (that lives in the
   * `translate` pipe), so the day count is substituted here.
   */
  readonly rangeOptions = (): SelectOption[] =>
    RANGE_DAYS.map((days) => ({
      value: days,
      label: this.#language
        .translate('lastNDays')
        .replace('{{days}}', String(days)),
    }));

  /** Orders are keyed by UUID; the head is enough to recognise a row. */
  shortId(id: string): string {
    return id.slice(0, 8);
  }

  onRangeChange(value: string | number | null) {
    if (value !== null) this.store.setDays(Number(value));
  }

  onOpenOrder(order: AdminOrderModel) {
    this.#router.navigate(['/admin/orders', order.id]);
  }

  onAllOrders() {
    this.#router.navigate(['/admin/orders']);
  }
}
