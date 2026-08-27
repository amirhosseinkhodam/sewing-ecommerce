import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  AddCartItemPayloadModel,
  CartModel,
  UpdateCartItemPayloadModel,
} from '@domain/models/cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/cart';

  get(): Observable<CartModel> {
    return this.#http.get<CartModel>(this.#baseUrl);
  }

  addItem(payload: AddCartItemPayloadModel): Observable<CartModel> {
    return this.#http.post<CartModel>(`${this.#baseUrl}/items`, payload);
  }

  updateItem(
    itemId: string,
    payload: UpdateCartItemPayloadModel,
  ): Observable<CartModel> {
    return this.#http.patch<CartModel>(
      `${this.#baseUrl}/items/${itemId}`,
      payload,
    );
  }

  removeItem(itemId: string): Observable<CartModel> {
    return this.#http.delete<CartModel>(`${this.#baseUrl}/items/${itemId}`);
  }
}
