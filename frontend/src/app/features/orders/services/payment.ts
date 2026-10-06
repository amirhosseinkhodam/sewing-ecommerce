import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  PaymentMethodsModel,
  PaymentStartResponseModel,
} from '@domain/models/payment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/payment';

  methods(): Observable<PaymentMethodsModel> {
    return this.#http.get<PaymentMethodsModel>(`${this.#baseUrl}/methods`);
  }

  start(orderId: string): Observable<PaymentStartResponseModel> {
    return this.#http.post<PaymentStartResponseModel>(
      `${this.#baseUrl}/${orderId}/start`,
      {},
    );
  }
}
