import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ShopSettingsModel,
  UpdateShopSettingsPayloadModel,
} from '@domain/models/settings';

/**
 * The shop's own details. The read is public — the Contact/About pages show it
 * to guests and checkout shows the bank card and shipping rates to customers —
 * while the write is admin-only, so the two hit different base URLs.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly #http = inject(HttpClient);
  readonly #publicUrl = '/api/settings';
  readonly #adminUrl = '/api/admin/settings';

  get(): Observable<ShopSettingsModel> {
    return this.#http.get<ShopSettingsModel>(this.#publicUrl);
  }

  update(
    payload: UpdateShopSettingsPayloadModel,
  ): Observable<ShopSettingsModel> {
    return this.#http.patch<ShopSettingsModel>(this.#adminUrl, payload);
  }
}
