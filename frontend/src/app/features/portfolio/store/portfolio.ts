import { computed, inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { injectCategoriesQuery } from '../../products/query/products';
import {
  injectPortfolioItemQuery,
  injectPortfolioListQuery,
} from '../query/portfolio';

@Injectable()
export class PortfolioStore {
  readonly page = signal(1);
  readonly pageSize = signal(12);
  readonly category = signal<string | null>(null);
  readonly #slug = signal(inject(ActivatedRoute).snapshot.paramMap.get('slug'));

  readonly #listQuery = injectPortfolioListQuery(
    () => ({
      page: this.page(),
      pageSize: this.pageSize(),
      category: this.category() ?? undefined,
    }),
    () => !this.#slug(),
  );
  readonly #itemQuery = injectPortfolioItemQuery(() => this.#slug());
  readonly #categoryQuery = injectCategoriesQuery();

  readonly items = computed(() => this.#listQuery.data()?.items ?? []);
  readonly total = computed(() => this.#listQuery.data()?.total ?? 0);
  readonly totalPages = computed(() => this.#listQuery.data()?.totalPages ?? 0);
  readonly item = computed(() => this.#itemQuery.data() ?? null);
  readonly categories = computed(() => this.#categoryQuery.data() ?? []);
  readonly loading = computed(() =>
    this.#slug() ? this.#itemQuery.isPending() : this.#listQuery.isPending(),
  );
  readonly error = computed(() =>
    this.#slug() ? this.#itemQuery.error() : this.#listQuery.error(),
  );

  loadItem(slug: string): void {
    this.#slug.set(slug);
  }

  setPage(page: number): void {
    this.page.set(page);
  }

  setCategory(category: string | null): void {
    this.category.set(category);
    this.page.set(1);
  }
}
