import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '@shared/components/button';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { TranslatePipe } from '@shared/pipes/translate';
import type { ProductModel } from '../models/product';
import { ProductCardComponent } from '../components/product-card';
import { ProductFilterComponent } from '../components/product-filter';
import { CatalogStore } from '../store/catalog';

@Component({
  selector: 'app-catalog',
  imports: [
    ButtonComponent,
    LoadingSpinnerComponent,
    ProductCardComponent,
    ProductFilterComponent,
    TranslatePipe,
  ],
  providers: [CatalogStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {{ 'products' | translate }}
      </h1>

      <div class="mt-6">
        <app-product-filter
          [categories]="store.categories()"
          [query]="store.query()"
          (filtersChange)="store.patchQuery($event)"
          (filtersReset)="store.clearFilters()"
        />
      </div>

      @if (store.loading()) {
        <div class="flex justify-center py-20">
          <app-loading-spinner
            size="lg"
            cssClass="text-slate-400 dark:text-slate-500"
          />
        </div>
      } @else if (store.error()) {
        <div
          class="mt-10 flex flex-col items-center gap-4 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center"
        >
          <p class="text-slate-500 dark:text-slate-400">
            {{ 'couldNotLoadData' | translate }}
          </p>
          <app-button variant="primary" (buttonClick)="store.loadProducts()">
            {{ 'refresh' | translate }}
          </app-button>
        </div>
      } @else if (store.products().length === 0) {
        <div
          class="mt-10 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center"
        >
          <p class="text-slate-500 dark:text-slate-400">
            {{ 'noProductsFound' | translate }}
          </p>
        </div>
      } @else {
        <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          @for (product of store.products(); track product.id) {
            <app-product-card
              [product]="product"
              (productClick)="onProductClick($event)"
            />
          }
        </div>

        @if (store.totalPages() > 1) {
          <div class="mt-10 flex items-center justify-center gap-4">
            <app-button
              variant="secondary"
              [disabled]="store.query().page! <= 1"
              (buttonClick)="onPageChange(store.query().page! - 1)"
            >
              {{ 'previous' | translate }}
            </app-button>
            <span class="text-sm text-slate-500 dark:text-slate-400">
              {{
                'pageOf'
                  | translate
                    : {
                        page: store.query().page!,
                        totalPages: store.totalPages(),
                      }
              }}
            </span>
            <app-button
              variant="secondary"
              [disabled]="store.query().page! >= store.totalPages()"
              (buttonClick)="onPageChange(store.query().page! + 1)"
            >
              {{ 'next' | translate }}
            </app-button>
          </div>
        }
      }
    </div>
  `,
})
export class CatalogComponent implements OnInit {
  readonly store = inject(CatalogStore);

  readonly #router = inject(Router);

  ngOnInit() {
    this.store.loadCategories();
    this.store.loadProducts();
  }

  onProductClick(product: ProductModel) {
    this.#router.navigate(['/products', product.slug]);
  }

  onPageChange(page: number) {
    this.store.setPage(page);
  }
}
