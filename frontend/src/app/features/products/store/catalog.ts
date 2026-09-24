import { computed, Injectable, signal } from '@angular/core';
import type { ProductQueryModel } from '../models/product';
import { injectCategoriesQuery, injectProductsQuery } from '../query/products';

const DEFAULT_QUERY: ProductQueryModel = { page: 1, pageSize: 12 };

@Injectable()
export class CatalogStore {
  readonly query = signal<ProductQueryModel>({ ...DEFAULT_QUERY });

  readonly #productsQuery = injectProductsQuery(() => this.query());
  readonly #categoriesQuery = injectCategoriesQuery();

  readonly products = computed(() => this.#productsQuery.data()?.items ?? []);
  readonly total = computed(() => this.#productsQuery.data()?.total ?? 0);
  readonly totalPages = computed(
    () => this.#productsQuery.data()?.totalPages ?? 1,
  );
  readonly categories = computed(() => this.#categoriesQuery.data() ?? []);
  readonly loading = computed(() => this.#productsQuery.isPending());
  readonly categoriesLoading = computed(() =>
    this.#categoriesQuery.isPending(),
  );
  readonly error = computed(() => this.#productsQuery.error()?.message ?? null);

  loadProducts(): void {
    void this.#productsQuery.refetch();
  }

  patchQuery(patch: Partial<ProductQueryModel>): void {
    this.query.update((query) => ({ ...query, ...patch, page: 1 }));
  }

  setPage(page: number): void {
    this.query.update((query) => ({ ...query, page }));
  }

  clearFilters(): void {
    this.query.set({ ...DEFAULT_QUERY });
  }
}
