import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { ImageGalleryComponent } from '@shared/components/image-gallery';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { NotificationService } from '@shared/services/notification';
import { LanguageService } from '@shared/services/language';
import { AuthStore } from '@auth/store/auth';
import type { ProductVariantModel } from '../models/product';
import { SizeSelectorComponent } from '../components/size-selector';
import { ProductDetailStore } from '../store/product-detail';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    ImageGalleryComponent,
    LoadingSpinnerComponent,
    SizeSelectorComponent,
    LocalizedNumberPipe,
    TranslatePipe,
  ],
  providers: [ProductDetailStore],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <app-button variant="ghost" cssClass="mb-6" (buttonClick)="onBack()">
        &larr; {{ 'backToProducts' | translate }}
      </app-button>

      @if (store.loading()) {
        <div class="flex justify-center py-20">
          <app-loading-spinner
            size="lg"
            cssClass="text-slate-400 dark:text-slate-500"
          />
        </div>
      } @else if (store.error()) {
        <div
          class="flex flex-col items-center gap-4 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center"
        >
          <p class="text-slate-500 dark:text-slate-400">
            {{ 'couldNotLoadData' | translate }}
          </p>
          <app-button variant="primary" (buttonClick)="onBack()">
            {{ 'backToProducts' | translate }}
          </app-button>
        </div>
      } @else {
        @if (store.product(); as product) {
          <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <app-image-gallery [images]="product.images" [alt]="product.name" />

            <div class="flex flex-col gap-6">
              <div>
                @if (product.category) {
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    {{ product.category.name }}
                  </p>
                }
                <h1
                  class="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100"
                >
                  {{ product.name }}
                </h1>
              </div>

              <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {{ product.price | localizedNumber }}
                <span
                  class="text-base font-normal text-slate-500 dark:text-slate-400"
                >
                  {{ 'currencyToman' | translate }}
                </span>
              </p>

              @if (product.fabric) {
                <div>
                  <h2
                    class="text-sm font-medium text-slate-500 dark:text-slate-400"
                  >
                    {{ 'fabric' | translate }}
                  </h2>
                  <p class="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {{ product.fabric }}
                  </p>
                </div>
              }

              <div>
                <h2
                  class="text-sm font-medium text-slate-500 dark:text-slate-400"
                >
                  {{ 'sizes' | translate }}
                </h2>
                <div class="mt-2">
                  <app-size-selector
                    [variants]="product.variants"
                    [selectedSize]="selectedVariant()?.id ?? null"
                    (sizeChange)="onSizeChange($event)"
                  />
                </div>
                @if (selectedVariant(); as variant) {
                  <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    @if (variant.stock === 0) {
                      <span class="text-red-600 dark:text-red-400">
                        {{ 'outOfStock' | translate }}
                      </span>
                    } @else {
                      <span class="text-green-600 dark:text-green-400">
                        {{ 'inStock' | translate }}
                      </span>
                    }
                  </p>
                }
              </div>

              <app-button
                variant="primary"
                size="lg"
                [disabled]="hasNoStock()"
                (buttonClick)="onAddToCart()"
              >
                {{ 'addToCart' | translate }}
              </app-button>

              @if (product.description) {
                <app-card variant="bordered">
                  <h2
                    class="text-sm font-medium text-slate-500 dark:text-slate-400"
                  >
                    {{ 'description' | translate }}
                  </h2>
                  <p
                    class="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                  >
                    {{ product.description }}
                  </p>
                </app-card>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  readonly store = inject(ProductDetailStore);

  readonly selectedVariant = signal<ProductVariantModel | null>(null);

  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #auth = inject(AuthStore);
  readonly #notification = inject(NotificationService);
  readonly #languageService = inject(LanguageService);
  readonly #destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.#route.paramMap
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((params) => {
        const slug = params.get('slug');
        if (slug) {
          this.selectedVariant.set(null);
          this.store.loadBySlug(slug);
        }
      });
  }

  readonly hasNoStock = () => {
    const product = this.store.product();
    if (!product) return true;
    if (product.variants.length === 0) return false;
    return product.variants.every((variant) => variant.stock === 0);
  };

  onSizeChange(variant: ProductVariantModel) {
    this.selectedVariant.set(variant);
  }

  onAddToCart() {
    const product = this.store.product();
    if (!product) return;
    if (product.variants.length > 0 && !this.selectedVariant()) {
      this.#notification.show(
        'warning',
        this.#languageService.translate('selectSize'),
      );
      return;
    }
    if (!this.#auth.isLoggedIn()) {
      this.#notification.show(
        'error',
        this.#languageService.translate('loginToAddToCart'),
      );
      this.#router.navigate(['/login']);
      return;
    }
    this.#notification.show(
      'success',
      this.#languageService.translate('addedToCart'),
    );
  }

  onBack() {
    this.#router.navigate(['/products']);
  }
}
