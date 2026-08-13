import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ProductDetailModel,
  ProductListResponseModel,
  ProductModel,
  ProductPayloadModel,
  ProductQueryModel,
} from '../../products/models/product';
import { toProductParams } from '../../products/services/product-query';

@Injectable({ providedIn: 'root' })
export class AdminProductService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/admin/products';

  list(query: ProductQueryModel = {}): Observable<ProductListResponseModel> {
    return this.#http.get<ProductListResponseModel>(this.#baseUrl, {
      params: toProductParams(query),
    });
  }

  get(id: string): Observable<ProductDetailModel> {
    return this.#http.get<ProductDetailModel>(`${this.#baseUrl}/${id}`);
  }

  create(payload: ProductPayloadModel): Observable<ProductModel> {
    return this.#http.post<ProductModel>(this.#baseUrl, payload);
  }

  update(id: string, payload: ProductPayloadModel): Observable<ProductModel> {
    return this.#http.patch<ProductModel>(`${this.#baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<unknown> {
    return this.#http.delete(`${this.#baseUrl}/${id}`);
  }
}
