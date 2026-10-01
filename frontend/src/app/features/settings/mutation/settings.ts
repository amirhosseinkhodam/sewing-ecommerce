import { inject } from '@angular/core';
import {
  injectMutation,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import type { UpdateShopSettingsPayloadModel } from '@domain/models/settings';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { injectMutationFeedback } from '@shared/utils/mutation-feedback';
import { SettingsService } from '../services/settings';

/**
 * Saving settings changes what guests see on Contact/About and what checkout
 * charges for shipping, so the public cache is invalidated alongside the admin
 * one.
 */
export function injectUpdateSettingsMutation(options?: {
  onSuccess?: () => void;
}) {
  const settingsService = inject(SettingsService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (payload: UpdateShopSettingsPayloadModel) =>
      firstValueFrom(settingsService.update(payload)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.settings] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.adminSettings] }),
      ]);
      feedback.success('settingsSaved');
      options?.onSuccess?.();
    },
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}
