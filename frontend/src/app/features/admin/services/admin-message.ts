import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ContactMessageModel,
  PaginatedMessagesModel,
} from '@domain/models/contact';

export interface AdminMessageQueryModel {
  readonly page?: number;
  readonly pageSize?: number;
  readonly isRead?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminMessageService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/admin/messages';

  list(query: AdminMessageQueryModel = {}): Observable<PaginatedMessagesModel> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);
    if (query.isRead !== undefined) {
      params = params.set('isRead', query.isRead);
    }
    return this.#http.get<PaginatedMessagesModel>(this.#baseUrl, { params });
  }

  markRead(id: string): Observable<ContactMessageModel> {
    return this.#http.patch<ContactMessageModel>(
      `${this.#baseUrl}/${id}/read`,
      {},
    );
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.#http.delete<{ deleted: boolean }>(`${this.#baseUrl}/${id}`);
  }
}
