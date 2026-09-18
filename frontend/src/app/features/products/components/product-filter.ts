import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  PRODUCT_SORTS,
  type CategoryModel,
  type ProductQueryModel,
  type ProductSort,
} from '../models/product';
import { ButtonComponent } from '@shared/components/button';
import { InputComponent } from '@shared/components/input';
import { SelectComponent } from '@shared/components/select';
import { SelectOption } from '@shared/models/select';
import { TranslatePipe } from '@shared/pipes/translate';
import { LanguageService } from '@shared/services/language';

@Component({
  selector: 'app-product-filter',
  imports: [
    FormsModule,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
    >
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-full sm:w-56">
          <app-input
            [ngModel]="search()"
            [placeholder]="'search' | translate"
            cssClass="ps-9"
            (inputChange)="onSearchInput($event)"
          />
        </div>

        <div class="w-full sm:w-48">
          <app-select
            [ngModel]="category()"
            [options]="categoryOptions()"
            [placeholder]="'allCategories' | translate"
            [clearable]="false"
            (selectChange)="onCategoryChange($event)"
          />
        </div>

        <div class="w-full sm:w-48">
          <app-select
            [ngModel]="sort()"
            [options]="sortOptions()"
            [placeholder]="'sortBy' | translate"
            [clearable]="false"
            (selectChange)="onSortChange($event)"
          />
        </div>

        <div class="w-full sm:w-36">
          <app-input
            type="number"
            [ngModel]="minPrice()"
            [placeholder]="'fromPrice' | translate"
            (inputBlur)="onMinPriceBlur()"
          />
        </div>

        <div class="w-full sm:w-36">
          <app-input
            type="number"
            [ngModel]="maxPrice()"
            [placeholder]="'toPrice' | translate"
            (inputBlur)="onMaxPriceBlur()"
          />
        </div>

        <app-button variant="ghost" (buttonClick)="onReset()">
          {{ 'clearFilters' | translate }}
        </app-button>
      </div>
    </div>
  `,
})
export class ProductFilterComponent {
  readonly categories = input.required<CategoryModel[]>();
  readonly query = input.required<ProductQueryModel>();

  readonly filtersChange = output<Partial<ProductQueryModel>>();
  readonly filtersReset = output<void>();

  readonly search = signal('');
  readonly category = signal('all');
  readonly sort = signal<ProductSort>(PRODUCT_SORTS.newest);
  readonly minPrice = signal('');
  readonly maxPrice = signal('');

  readonly #languageService = inject(LanguageService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #search$ = new Subject<string>();

  constructor() {
    effect(() => {
      const query = this.query();
      this.search.set(query.search ?? '');
      this.category.set(query.category ?? 'all');
      this.sort.set(query.sort ?? PRODUCT_SORTS.newest);
      this.minPrice.set(
        query.minPrice !== undefined ? String(query.minPrice) : '',
      );
      this.maxPrice.set(
        query.maxPrice !== undefined ? String(query.maxPrice) : '',
      );
    });

    const sub = this.#search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) =>
        this.filtersChange.emit({ search: value.trim() ? value : undefined }),
      );
    this.#destroyRef.onDestroy(() => sub.unsubscribe());
  }

  readonly categoryOptions = (): SelectOption[] => [
    {
      value: 'all',
      label: this.#languageService.translate('allCategories'),
    },
    ...this.categories().map((category) => ({
      value: category.slug,
      label: category.name,
    })),
  ];

  readonly sortOptions = (): SelectOption[] => [
    {
      value: PRODUCT_SORTS.newest,
      label: this.#languageService.translate('newest'),
    },
    {
      value: PRODUCT_SORTS.priceAsc,
      label: this.#languageService.translate('priceAsc'),
    },
    {
      value: PRODUCT_SORTS.priceDesc,
      label: this.#languageService.translate('priceDesc'),
    },
  ];

  onSearchInput(value: string) {
    this.search.set(value);
    this.#search$.next(value);
  }

  onCategoryChange(value: number | string | null) {
    const slug = String(value ?? 'all');
    this.category.set(slug);
    this.filtersChange.emit({ category: slug === 'all' ? undefined : slug });
  }

  onSortChange(value: number | string | null) {
    const sort = value as ProductSort | null;
    const next = sort ?? PRODUCT_SORTS.newest;
    this.sort.set(next);
    this.filtersChange.emit({ sort: next });
  }

  onMinPriceBlur() {
    const value = this.minPrice().trim();
    this.filtersChange.emit({
      minPrice: value ? Number(value) : undefined,
    });
  }

  onMaxPriceBlur() {
    const value = this.maxPrice().trim();
    this.filtersChange.emit({
      maxPrice: value ? Number(value) : undefined,
    });
  }

  onReset() {
    this.filtersReset.emit();
  }
}
