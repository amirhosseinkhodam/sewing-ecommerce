import { computed, Injectable, signal } from '@angular/core';
import { injectAdminOrdersQuery } from '../query/admin-orders';
import { injectAdminDashboardStatsQuery } from '../query/admin-dashboard';

/** How many of the newest orders the dashboard lists. */
const RECENT_ORDERS_PAGE_SIZE = 5;

@Injectable()
export class AdminDashboardStore {
  /** Trend window the page's range picker drives. */
  readonly days = signal(30);

  readonly #statsQuery = injectAdminDashboardStatsQuery(() => ({
    days: this.days(),
  }));
  readonly stats = computed(() => this.#statsQuery.data() ?? null);
  readonly loading = computed(() => this.#statsQuery.isPending());

  /**
   * "Recent orders" is the first page of the admin order list, so it reuses
   * that query rather than adding an endpoint; the shared cache key also means
   * an admin status change refreshes both screens.
   */
  readonly #recentOrdersQuery = injectAdminOrdersQuery(
    () => ({ page: 1, pageSize: RECENT_ORDERS_PAGE_SIZE }),
    () => true,
  );
  readonly recentOrders = computed(
    () => this.#recentOrdersQuery.data()?.items ?? [],
  );

  setDays(days: number): void {
    this.days.set(days);
  }
}
