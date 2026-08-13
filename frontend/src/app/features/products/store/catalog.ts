import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import type {
  CategoryModel,
  ProductModel,
  ProductQueryModel,
} from '../models/product';
import { CategoryService } from '../services/category';
import { ProductService } from '../services/product';

const DEFAULT_QUERY: ProductQueryModel = { page: 1, pageSize: 12 };

interface CatalogState {
  products: ProductModel[];
  categories: CategoryModel[];
  total: number;
  totalPages: number;
  query: ProductQueryModel;
  loading: boolean;
  categoriesLoading: boolean;
  error: string | null;
}

const initialState: CatalogState = {
  products: [],
  categories: [],
  total: 0,
  totalPages: 1,
  query: { ...DEFAULT_QUERY },
  loading: false,
  categoriesLoading: false,
  error: null,
};

export const CatalogStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      productService = inject(ProductService),
      categoryService = inject(CategoryService),
    ) => ({
      loadProducts: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            productService.list(store.query()).pipe(
              tapResponse({
                next: (res) =>
                  patchState(store, {
                    products: res.items,
                    total: res.total,
                    totalPages: res.totalPages,
                    loading: false,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    loading: false,
                    error: err.error?.message ?? 'couldNotLoadData',
                  }),
              }),
            ),
          ),
        ),
      ),
      loadCategories: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { categoriesLoading: true })),
          switchMap(() =>
            categoryService.list().pipe(
              tapResponse({
                next: (categories) =>
                  patchState(store, { categories, categoriesLoading: false }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    categoriesLoading: false,
                    error: err.error?.message ?? 'couldNotLoadData',
                  }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
  withMethods((store) => ({
    patchQuery: (patch: Partial<ProductQueryModel>) => {
      patchState(store, {
        query: { ...store.query(), ...patch, page: 1 },
      });
      store.loadProducts();
    },
    setPage: (page: number) => {
      patchState(store, { query: { ...store.query(), page } });
      store.loadProducts();
    },
    clearFilters: () => {
      patchState(store, { query: { ...DEFAULT_QUERY } });
      store.loadProducts();
    },
  })),
);
