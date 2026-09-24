import { computed, Injectable } from '@angular/core';
import type { SaveCategoryModel } from '../../products/models/product';
import {
  injectRemoveCategoryMutation,
  injectSaveCategoryMutation,
} from '../mutation/admin-catalog';
import { injectAdminCategoriesQuery } from '../query/admin-catalog';

@Injectable()
export class AdminCategoryStore {
  readonly #categoriesQuery = injectAdminCategoriesQuery();
  readonly categories = computed(() => this.#categoriesQuery.data() ?? []);
  readonly loading = computed(() => this.#categoriesQuery.isPending());

  readonly #saveMutation = injectSaveCategoryMutation();
  readonly #removeMutation = injectRemoveCategoryMutation();
  readonly saving = computed(() => this.#saveMutation.isPending());

  saveCategory(value: SaveCategoryModel): void {
    this.#saveMutation.mutate(value);
  }

  removeCategory(id: string): void {
    this.#removeMutation.mutate(id);
  }
}
