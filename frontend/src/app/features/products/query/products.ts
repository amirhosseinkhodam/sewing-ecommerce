import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import type { ProductQueryModel } from '../models/product';
import { CategoryService } from '../services/category';
import { ProductService } from '../services/product';

/** Paginated public product list. `params` keeps the cache key reactive. */
export function injectProductsQuery(params: () => ProductQueryModel) {
  const productService = inject(ProductService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.products, params()],
    queryFn: () => firstValueFrom(productService.list(params())),
  }));
}

/** Public product detail. Idle until `slug` returns a value. */
export function injectProductQuery(slug: () => string | null) {
  const productService = inject(ProductService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.product, slug()],
    enabled: !!slug(),
    queryFn: () => firstValueFrom(productService.getBySlug(slug()!)),
  }));
}

/**
 * Category list, shared by the public catalog, the portfolio filter and both
 * admin forms — one cache entry serves all of them.
 */
export function injectCategoriesQuery() {
  const categoryService = inject(CategoryService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.categories],
    queryFn: () => firstValueFrom(categoryService.list()),
  }));
}
