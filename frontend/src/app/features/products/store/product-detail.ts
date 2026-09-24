import { computed, Injectable, signal } from '@angular/core';
import { injectProductQuery } from '../query/products';

@Injectable()
export class ProductDetailStore {
  readonly #slug = signal<string | null>(null);
  readonly #productQuery = injectProductQuery(() => this.#slug());

  readonly product = computed(() => this.#productQuery.data() ?? null);
  readonly loading = computed(
    () => !!this.#slug() && this.#productQuery.isPending(),
  );
  readonly error = computed(() => this.#productQuery.error()?.message ?? null);

  loadBySlug(slug: string): void {
    this.#slug.set(slug);
  }
}
