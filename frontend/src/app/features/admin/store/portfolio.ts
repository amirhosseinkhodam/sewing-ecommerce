import { computed, Injectable, signal } from '@angular/core';
import { injectRemovePortfolioMutation } from '../mutation/admin-portfolio';
import { injectAdminPortfolioQuery } from '../query/admin-portfolio';

@Injectable()
export class AdminPortfolioStore {
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');

  readonly #itemsQuery = injectAdminPortfolioQuery(() => ({
    page: this.page(),
    pageSize: this.pageSize(),
    search: this.search() || undefined,
  }));
  readonly items = computed(() => this.#itemsQuery.data()?.items ?? []);
  readonly total = computed(() => this.#itemsQuery.data()?.total ?? 0);
  readonly totalPages = computed(
    () => this.#itemsQuery.data()?.totalPages ?? 0,
  );
  readonly loading = computed(() => this.#itemsQuery.isPending());

  readonly #removeMutation = injectRemovePortfolioMutation();

  setPage(page: number): void {
    this.page.set(page);
  }

  setSearch(search: string): void {
    this.search.set(search);
    this.page.set(1);
  }

  removeItem(id: string): void {
    this.#removeMutation.mutate(id);
  }
}
