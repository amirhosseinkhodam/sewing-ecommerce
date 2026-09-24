import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  PaginatedPortfolioModel,
  PortfolioModel,
} from '@domain/models/portfolio';

export interface PortfolioQueryModel {
  readonly page?: number;
  readonly pageSize?: number;
  readonly category?: string;
}

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/portfolio';

  list(query: PortfolioQueryModel = {}): Observable<PaginatedPortfolioModel> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);
    if (query.category) params = params.set('category', query.category);
    return this.#http.get<PaginatedPortfolioModel>(this.#baseUrl, { params });
  }

  getBySlug(slug: string): Observable<PortfolioModel> {
    return this.#http.get<PortfolioModel>(`${this.#baseUrl}/${slug}`);
  }
}
