import { inject } from '@angular/core';
import {
  injectMutation,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import type { PortfolioPayloadModel } from '@domain/models/portfolio';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { injectMutationFeedback } from '@shared/utils/mutation-feedback';
import { AdminPortfolioService } from '../services/admin-portfolio';

export interface SavePortfolioModel {
  readonly id?: string;
  readonly payload: PortfolioPayloadModel;
}

/** An admin write also changes the public gallery, so both caches drop. */
function invalidatePortfolio(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.adminPortfolio] }),
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.adminPortfolioItem],
    }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.portfolio] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.portfolioItem] }),
  ]);
}

export function injectSavePortfolioMutation(options?: {
  readonly onSuccess?: () => void;
}) {
  const portfolioService = inject(AdminPortfolioService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: ({ id, payload }: SavePortfolioModel) =>
      firstValueFrom(
        id
          ? portfolioService.update(id, payload)
          : portfolioService.create(payload),
      ),
    onSuccess: async () => {
      await invalidatePortfolio(queryClient);
      feedback.success('portfolioSaved');
      options?.onSuccess?.();
    },
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}

export function injectRemovePortfolioMutation() {
  const portfolioService = inject(AdminPortfolioService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(portfolioService.remove(id)),
    onSuccess: async () => {
      await invalidatePortfolio(queryClient);
      feedback.success('portfolioDeleted');
    },
    onError: (error) => feedback.error(error, 'couldNotDelete'),
  }));
}
