import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { CategoryModel } from '../models/product';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/categories';

  list(): Observable<CategoryModel[]> {
    return this.#http.get<CategoryModel[]>(this.#baseUrl);
  }
}
