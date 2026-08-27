import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { AddressModel, AddressPayloadModel } from '@domain/models/address';

@Injectable({ providedIn: 'root' })
export class AddressService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/addresses';

  list(): Observable<AddressModel[]> {
    return this.#http.get<AddressModel[]>(this.#baseUrl);
  }

  create(payload: AddressPayloadModel): Observable<AddressModel> {
    return this.#http.post<AddressModel>(this.#baseUrl, payload);
  }

  update(
    id: string,
    payload: Partial<AddressPayloadModel>,
  ): Observable<AddressModel> {
    return this.#http.patch<AddressModel>(`${this.#baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.#http.delete<{ deleted: boolean }>(`${this.#baseUrl}/${id}`);
  }
}
