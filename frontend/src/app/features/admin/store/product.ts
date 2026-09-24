import { computed, Injectable, signal } from '@angular/core';
import type { ProductQueryModel } from '../../products/models/product';
import { injectRemoveProductMutation } from '../mutation/admin-catalog';
import { injectAdminProductsQuery } from '../query/admin-catalog';

const DEFAULT_QUERY: ProductQueryModel = { page: 1, pageSize: 10 };

@Injectable()
export class AdminProductStore {
  readonly query = signal<ProductQueryModel>({ ...DEFAULT_QUERY });

  readonly #productsQuery = injectAdminProductsQuery(() => this.query());
  readonly products = computed(() => this.#productsQuery.data()?.items ?? []);
  readonly total = computed(() => this.#productsQuery.data()?.total ?? 0);
  readonly totalPages = computed(
    () => this.#productsQuery.data()?.totalPages ?? 1,
  );
  readonly loading = computed(() => this.#productsQuery.isPending());

  readonly #removeMutation = injectRemoveProductMutation();

  patchQuery(patch: Partial<ProductQueryModel>): void {
    this.query.update((query) => ({ ...query, ...patch, page: 1 }));
  }

  setPage(page: number): void {
    this.query.update((query) => ({ ...query, page }));
  }

  removeProduct(id: string): void {
    this.#removeMutation.mutate(id);
  }
}
