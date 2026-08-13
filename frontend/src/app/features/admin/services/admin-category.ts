import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  CategoryModel,
  CategoryPayloadModel,
} from '../../products/models/product';

@Injectable({ providedIn: 'root' })
export class AdminCategoryService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/admin/categories';

  list(): Observable<CategoryModel[]> {
    return this.#http.get<CategoryModel[]>(this.#baseUrl);
  }

  create(payload: CategoryPayloadModel): Observable<CategoryModel> {
    return this.#http.post<CategoryModel>(this.#baseUrl, payload);
  }

  update(id: string, payload: CategoryPayloadModel): Observable<CategoryModel> {
    return this.#http.patch<CategoryModel>(`${this.#baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<unknown> {
    return this.#http.delete(`${this.#baseUrl}/${id}`);
  }
}
