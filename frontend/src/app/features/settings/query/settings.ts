import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { SettingsService } from '../services/settings';

/**
 * The shop settings singleton. Imported by order detail (bank card), checkout
 * (shipping rates), the Contact/About pages and the app-shell footer (contact
 * details), so the cache is shared rather than refetched per feature.
 *
 * The row changes about as often as the shop's phone number does, so it is
 * kept fresh for a long time instead of being refetched on every navigation.
 */
export function injectShopSettingsQuery() {
  const settingsService = inject(SettingsService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.settings],
    staleTime: 5 * 60 * 1000,
    queryFn: () => firstValueFrom(settingsService.get()),
  }));
}
