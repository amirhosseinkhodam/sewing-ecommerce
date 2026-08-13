import { HttpParams } from '@angular/common/http';
import type { ProductQueryModel } from '../models/product';

export function toProductParams(query: ProductQueryModel): HttpParams {
  let params = new HttpParams();
  if (query.page) params = params.set('page', query.page);
  if (query.pageSize) params = params.set('pageSize', query.pageSize);
  if (query.search) params = params.set('search', query.search);
  if (query.category) params = params.set('category', query.category);
  if (query.minPrice !== undefined)
    params = params.set('minPrice', query.minPrice);
  if (query.maxPrice !== undefined)
    params = params.set('maxPrice', query.maxPrice);
  if (query.sort) params = params.set('sort', query.sort);
  if (query.isFeatured !== undefined) {
    params = params.set('isFeatured', query.isFeatured);
  }
  return params;
}
