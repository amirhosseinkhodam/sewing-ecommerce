import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { CreateOrderPayloadModel, OrderModel } from '@domain/models/order';

@Injectable({ providedIn: 'root' })
export class OrderService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/orders';

  create(payload: CreateOrderPayloadModel): Observable<OrderModel> {
    return this.#http.post<OrderModel>(this.#baseUrl, payload);
  }
}
