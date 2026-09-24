import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { SaveProductModel } from '../../products/models/product';
import { injectCategoriesQuery } from '../../products/query/products';
import { injectSaveProductMutation } from '../mutation/admin-catalog';
import { injectAdminProductQuery } from '../query/admin-catalog';

@Injectable()
export class ProductFormStore {
  readonly #router = inject(Router);
  readonly #id = signal<string | null>(null);

  // The shared public key, so the list is cached across every form that needs it.
  readonly #categoriesQuery = injectCategoriesQuery();
  readonly categories = computed(() => this.#categoriesQuery.data() ?? []);

  readonly #productQuery = injectAdminProductQuery(() => this.#id());
  readonly product = computed(() => this.#productQuery.data() ?? null);
  readonly loading = computed(
    () => !!this.#id() && this.#productQuery.isPending(),
  );

  readonly #saveMutation = injectSaveProductMutation({
    onSuccess: () => void this.#router.navigate(['/admin/products']),
  });
  readonly saving = computed(() => this.#saveMutation.isPending());

  loadProduct(id: string): void {
    this.#id.set(id);
  }

  save(value: SaveProductModel): void {
    this.#saveMutation.mutate(value);
  }
}
