import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  CreateOrderPayloadModel,
  OrderModel,
  PaginatedOrdersModel,
} from '@domain/models/order';
import type { OrderStatus } from '@domain/const/order-statuses';

export interface OrderListQueryModel {
  readonly page?: number;
  readonly pageSize?: number;
  readonly status?: OrderStatus;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/orders';

  list(query: OrderListQueryModel = {}): Observable<PaginatedOrdersModel> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);
    if (query.status) params = params.set('status', query.status);
    return this.#http.get<PaginatedOrdersModel>(this.#baseUrl, { params });
  }

  get(id: string): Observable<OrderModel> {
    return this.#http.get<OrderModel>(`${this.#baseUrl}/${id}`);
  }

  create(payload: CreateOrderPayloadModel): Observable<OrderModel> {
    return this.#http.post<OrderModel>(this.#baseUrl, payload);
  }

  uploadReceipt(id: string, paymentReceipt: string): Observable<OrderModel> {
    return this.#http.patch<OrderModel>(`${this.#baseUrl}/${id}/receipt`, {
      paymentReceipt,
    });
  }

  cancel(id: string): Observable<OrderModel> {
    return this.#http.patch<OrderModel>(`${this.#baseUrl}/${id}/cancel`, {});
  }
}
