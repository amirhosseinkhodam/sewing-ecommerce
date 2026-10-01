import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { DashboardStatsModel } from '@domain/models/dashboard';

export interface AdminDashboardQueryModel {
  /** Trend window length in days, counting today as the last bucket. */
  readonly days?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/admin/dashboard';

  getStats(
    query: AdminDashboardQueryModel = {},
  ): Observable<DashboardStatsModel> {
    let params = new HttpParams();
    if (query.days) params = params.set('days', query.days);
    return this.#http.get<DashboardStatsModel>(`${this.#baseUrl}/stats`, {
      params,
    });
  }
}
