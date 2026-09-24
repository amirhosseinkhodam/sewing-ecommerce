import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import {
  type AdminPortfolioQueryModel,
  AdminPortfolioService,
} from '../services/admin-portfolio';

/** Admin portfolio list — includes inactive items. */
export function injectAdminPortfolioQuery(
  params: () => AdminPortfolioQueryModel,
) {
  const portfolioService = inject(AdminPortfolioService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.adminPortfolio, params()],
    queryFn: () => firstValueFrom(portfolioService.list(params())),
  }));
}

/** Admin portfolio detail, by id rather than slug. Idle until `id` is set. */
export function injectAdminPortfolioItemQuery(id: () => string | null) {
  const portfolioService = inject(AdminPortfolioService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.adminPortfolioItem, id()],
    enabled: !!id(),
    queryFn: () => firstValueFrom(portfolioService.get(id()!)),
  }));
}
