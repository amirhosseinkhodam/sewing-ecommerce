import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import {
  type AdminDashboardQueryModel,
  AdminDashboardService,
} from '../services/admin-dashboard';

/**
 * Shop-wide stats for the dashboard. The figures move whenever an order or
 * message does, so the cache is kept short rather than long.
 */
export function injectAdminDashboardStatsQuery(
  params: () => AdminDashboardQueryModel,
) {
  const dashboardService = inject(AdminDashboardService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.adminDashboard, params()],
    staleTime: 60 * 1000,
    queryFn: () => firstValueFrom(dashboardService.getStats(params())),
  }));
}
