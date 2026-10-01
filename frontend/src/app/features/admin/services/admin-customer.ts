import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { PaginatedCustomersModel } from '@domain/models/customer';
import type { UserRole } from '@domain/const/user-roles';

export interface AdminCustomerQueryModel {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly role?: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AdminCustomerService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/admin/customers';

  list(
    query: AdminCustomerQueryModel = {},
  ): Observable<PaginatedCustomersModel> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);
    if (query.search) params = params.set('search', query.search);
    if (query.role) params = params.set('role', query.role);
    return this.#http.get<PaginatedCustomersModel>(this.#baseUrl, { params });
  }
}
