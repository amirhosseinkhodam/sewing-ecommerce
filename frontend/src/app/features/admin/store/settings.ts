import { computed, Injectable } from '@angular/core';
import type { UpdateShopSettingsPayloadModel } from '@domain/models/settings';
import { injectUpdateSettingsMutation } from '../../settings/mutation/settings';
import { injectShopSettingsQuery } from '../../settings/query/settings';

/**
 * The settings row is a singleton, so there is no filter or pagination state
 * here — the store exists to expose the query/mutation pair to the page.
 */
@Injectable()
export class AdminSettingsStore {
  readonly #settingsQuery = injectShopSettingsQuery();
  readonly settings = computed(() => this.#settingsQuery.data() ?? null);
  readonly loading = computed(() => this.#settingsQuery.isPending());

  readonly #updateMutation = injectUpdateSettingsMutation();
  readonly saving = computed(() => this.#updateMutation.isPending());

  save(payload: UpdateShopSettingsPayloadModel): void {
    this.#updateMutation.mutate(payload);
  }
}
