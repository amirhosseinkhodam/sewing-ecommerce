import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Image01Icon } from '@hugeicons/core-free-icons';
import type { PortfolioModel } from '@domain/models/portfolio';
import { ButtonComponent } from '@shared/components/button';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { SelectComponent } from '@shared/components/select';
import type { SelectOption } from '@shared/models/select';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { LanguageService } from '@shared/services/language';
import { PortfolioStore } from '../store/portfolio';

@Component({
  selector: 'app-portfolio',
  imports: [
    ButtonComponent,
    HugeiconsIconComponent,
    LoadingSpinnerComponent,
    LocalizedNumberPipe,
    SelectComponent,
    TranslatePipe,
  ],
  providers: [PortfolioStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ 'portfolio' | translate }}
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {{ 'ourWork' | translate }}
          </p>
        </div>
        @if (store.categories().length > 0) {
          <div class="w-full sm:w-64">
            <app-select
              [options]="categoryOptions()"
              [value]="store.category() ?? 'all'"
              (selectChange)="onCategoryChange($event)"
            />
          </div>
        }
      </div>

      @if (store.loading() && store.items().length === 0) {
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
          <p>{{ 'couldNotLoadData' | translate }}</p>
        </div>
      } @else if (store.items().length === 0) {
        <div
          class="flex flex-col items-center gap-3 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center"
        >
          <p class="text-lg font-medium text-slate-900 dark:text-slate-100">
            {{ 'noPortfolioItems' | translate }}
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ 'noPortfolioItemsMessage' | translate }}
          </p>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (item of store.items(); track item.id) {
            <button
              type="button"
              class="group flex flex-col overflow-hidden rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-start transition-shadow hover:shadow-card-hover focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              (click)="onView(item)"
            >
              @if (cover(item); as image) {
                <img
                  [src]="image"
                  [alt]="item.title"
                  loading="lazy"
                  class="aspect-square w-full object-cover bg-slate-100 dark:bg-slate-800 transition-transform duration-300 group-hover:scale-105"
                />
              } @else {
                <div
                  class="flex aspect-square w-full items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                >
                  <hugeicons-icon
                    [icon]="icons.Image01Icon"
                    [size]="32"
                    color="currentColor"
                    [strokeWidth]="1.5"
                  />
                </div>
              }
              <div class="flex flex-1 flex-col p-4">
                <h2
                  class="font-medium text-slate-900 dark:text-slate-100 truncate"
                >
                  {{ item.title }}
                </h2>
                @if (item.category; as category) {
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {{ category.name }}
                  </p>
                }
                @if (item.description; as description) {
                  <p
                    class="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2"
                  >
                    {{ description }}
                  </p>
                }
                <span
                  class="text-sm font-medium text-blue-600 dark:text-blue-500 mt-3"
                >
                  {{ 'viewProject' | translate }}
                </span>
              </div>
            </button>
          }
        </div>

        @if (store.totalPages() > 1) {
          <div class="flex items-center justify-center gap-4 mt-10">
            <app-button
              variant="secondary"
              [disabled]="store.page() <= 1"
              (buttonClick)="onPage(store.page() - 1)"
            >
              {{ 'previous' | translate }}
            </app-button>
            <span class="text-sm text-slate-500 dark:text-slate-400">
              {{ store.page() | localizedNumber }} /
              {{ store.totalPages() | localizedNumber }}
            </span>
            <app-button
              variant="secondary"
              [disabled]="store.page() >= store.totalPages()"
              (buttonClick)="onPage(store.page() + 1)"
            >
              {{ 'next' | translate }}
            </app-button>
          </div>
        }
      }
    </div>
  `,
})
export class PortfolioComponent {
  readonly store = inject(PortfolioStore);

  readonly icons = { Image01Icon };

  readonly #router = inject(Router);
  readonly #language = inject(LanguageService);

  readonly categoryOptions = (): SelectOption[] => [
    { value: 'all', label: this.#language.translate('allCategories') },
    ...this.store
      .categories()
      .map((category) => ({ value: category.slug, label: category.name })),
  ];

  cover(item: PortfolioModel): string | null {
    return item.images[0] ?? null;
  }

  onCategoryChange(value: string | number | null) {
    this.store.setCategory(
      value === 'all' || value === null ? null : `${value}`,
    );
  }

  onView(item: PortfolioModel) {
    this.#router.navigate(['/portfolio', item.slug]);
  }

  onPage(page: number) {
    this.store.setPage(page);
  }
}
