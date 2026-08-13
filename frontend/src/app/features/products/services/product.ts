import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProductDetailModel,
  ProductListResponseModel,
  ProductQueryModel,
} from '../models/product';
import { toProductParams } from './product-query';

@Injectable({ providedIn: 'root' })
export class ProductService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/products';

  list(query: ProductQueryModel = {}): Observable<ProductListResponseModel> {
    return this.#http.get<ProductListResponseModel>(this.#baseUrl, {
      params: toProductParams(query),
    });
  }

  getBySlug(slug: string): Observable<ProductDetailModel> {
    return this.#http.get<ProductDetailModel>(`${this.#baseUrl}/${slug}`);
  }
}
