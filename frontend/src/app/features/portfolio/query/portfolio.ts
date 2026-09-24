import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import {
  type PortfolioQueryModel,
  PortfolioService,
} from '../services/portfolio';

/** Paginated public gallery (active items only). */
export function injectPortfolioListQuery(
  params: () => PortfolioQueryModel,
  enabled: () => boolean,
) {
  const portfolioService = inject(PortfolioService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.portfolio, params()],
    enabled: enabled(),
    queryFn: () => firstValueFrom(portfolioService.list(params())),
  }));
}

/** Public portfolio detail by slug. Idle until `slug` returns a value. */
export function injectPortfolioItemQuery(slug: () => string | null) {
  const portfolioService = inject(PortfolioService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.portfolioItem, slug()],
    enabled: !!slug(),
    queryFn: () => firstValueFrom(portfolioService.getBySlug(slug()!)),
  }));
}
