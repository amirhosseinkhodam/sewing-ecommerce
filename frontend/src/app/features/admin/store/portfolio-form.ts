import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { injectCategoriesQuery } from '../../products/query/products';
import {
  injectSavePortfolioMutation,
  type SavePortfolioModel,
} from '../mutation/admin-portfolio';
import { injectAdminPortfolioItemQuery } from '../query/admin-portfolio';

@Injectable()
export class PortfolioFormStore {
  readonly #router = inject(Router);
  readonly #id = signal<string | null>(null);

  // The shared public key, so the list is cached across every form that needs it.
  readonly #categoriesQuery = injectCategoriesQuery();
  readonly categories = computed(() => this.#categoriesQuery.data() ?? []);

  readonly #itemQuery = injectAdminPortfolioItemQuery(() => this.#id());
  readonly item = computed(() => this.#itemQuery.data() ?? null);
  readonly loading = computed(
    () => !!this.#id() && this.#itemQuery.isPending(),
  );

  readonly #saveMutation = injectSavePortfolioMutation({
    onSuccess: () => void this.#router.navigate(['/admin/portfolio']),
  });
  readonly saving = computed(() => this.#saveMutation.isPending());

  loadItem(id: string): void {
    this.#id.set(id);
  }

  save(value: SavePortfolioModel): void {
    this.#saveMutation.mutate(value);
  }
}
