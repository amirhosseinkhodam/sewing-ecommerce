import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  PaginatedPortfolioModel,
  PortfolioModel,
  PortfolioPayloadModel,
} from '@domain/models/portfolio';

export interface AdminPortfolioQueryModel {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminPortfolioService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/admin/portfolio';

  list(
    query: AdminPortfolioQueryModel = {},
  ): Observable<PaginatedPortfolioModel> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);
    if (query.search) params = params.set('search', query.search);
    return this.#http.get<PaginatedPortfolioModel>(this.#baseUrl, { params });
  }

  get(id: string): Observable<PortfolioModel> {
    return this.#http.get<PortfolioModel>(`${this.#baseUrl}/${id}`);
  }

  create(payload: PortfolioPayloadModel): Observable<PortfolioModel> {
    return this.#http.post<PortfolioModel>(this.#baseUrl, payload);
  }

  update(
    id: string,
    payload: Partial<PortfolioPayloadModel>,
  ): Observable<PortfolioModel> {
    return this.#http.patch<PortfolioModel>(`${this.#baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.#http.delete<{ deleted: boolean }>(`${this.#baseUrl}/${id}`);
  }
}
