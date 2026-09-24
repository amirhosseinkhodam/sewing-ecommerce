import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import type { ProductQueryModel } from '../../products/models/product';
import { AdminCategoryService } from '../services/admin-category';
import { AdminProductService } from '../services/admin-product';

/** Admin category list — separate from the public `categories` cache. */
export function injectAdminCategoriesQuery() {
  const categoryService = inject(AdminCategoryService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.adminCategories],
    queryFn: () => firstValueFrom(categoryService.list()),
  }));
}

/** Admin product list — includes inactive products. */
export function injectAdminProductsQuery(params: () => ProductQueryModel) {
  const productService = inject(AdminProductService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.adminProducts, params()],
    queryFn: () => firstValueFrom(productService.list(params())),
  }));
}

/** Admin product detail, by id rather than slug. Idle until `id` is set. */
export function injectAdminProductQuery(id: () => string | null) {
  const productService = inject(AdminProductService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.adminProduct, id()],
    enabled: !!id(),
    queryFn: () => firstValueFrom(productService.get(id()!)),
  }));
}
