import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  AdminOrderModel,
  PaginatedOrdersModel,
} from '@domain/models/order';
import type { OrderStatus } from '@domain/const/order-statuses';
import type { PaymentStatus } from '@domain/const/payment-statuses';

export interface AdminOrderQueryModel {
  readonly page?: number;
  readonly pageSize?: number;
  readonly status?: OrderStatus;
  readonly paymentStatus?: PaymentStatus;
  readonly search?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/admin/orders';

  list(
    query: AdminOrderQueryModel = {},
  ): Observable<PaginatedOrdersModel<AdminOrderModel>> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);
    if (query.status) params = params.set('status', query.status);
    if (query.paymentStatus) {
      params = params.set('paymentStatus', query.paymentStatus);
    }
    if (query.search) params = params.set('search', query.search);
    return this.#http.get<PaginatedOrdersModel<AdminOrderModel>>(
      this.#baseUrl,
      {
        params,
      },
    );
  }

  get(id: string): Observable<AdminOrderModel> {
    return this.#http.get<AdminOrderModel>(`${this.#baseUrl}/${id}`);
  }

  updateStatus(
    id: string,
    status: OrderStatus,
    trackingCode?: string,
  ): Observable<AdminOrderModel> {
    return this.#http.patch<AdminOrderModel>(`${this.#baseUrl}/${id}/status`, {
      status,
      ...(trackingCode ? { trackingCode } : {}),
    });
  }

  updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
  ): Observable<AdminOrderModel> {
    return this.#http.patch<AdminOrderModel>(`${this.#baseUrl}/${id}/payment`, {
      paymentStatus,
    });
  }
}
