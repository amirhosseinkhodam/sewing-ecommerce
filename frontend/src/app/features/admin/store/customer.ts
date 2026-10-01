import { computed, Injectable, signal } from '@angular/core';
import type { UserRole } from '@domain/const/user-roles';
import { injectAdminCustomersQuery } from '../query/admin-customers';

@Injectable()
export class AdminCustomerStore {
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');
  /** null = every role, otherwise CUSTOMER or ADMIN only. */
  readonly role = signal<UserRole | null>(null);

  readonly #customersQuery = injectAdminCustomersQuery(() => ({
    page: this.page(),
    pageSize: this.pageSize(),
    search: this.search() || undefined,
    role: this.role() ?? undefined,
  }));
  readonly customers = computed(() => this.#customersQuery.data()?.items ?? []);
  readonly total = computed(() => this.#customersQuery.data()?.total ?? 0);
  readonly totalPages = computed(
    () => this.#customersQuery.data()?.totalPages ?? 0,
  );
  readonly loading = computed(() => this.#customersQuery.isPending());

  setPage(page: number): void {
    this.page.set(page);
  }

  setSearch(search: string): void {
    this.search.set(search);
    this.page.set(1);
  }

  setRole(role: UserRole | null): void {
    this.role.set(role);
    this.page.set(1);
  }
}
