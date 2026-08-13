import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import type { ProductDetailModel } from '../models/product';
import { ProductService } from '../services/product';

interface ProductDetailState {
  product: ProductDetailModel | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProductDetailState = {
  product: null,
  loading: false,
  error: null,
};

export const ProductDetailStore = signalStore(
  withState(initialState),
  withMethods((store, productService = inject(ProductService)) => ({
    loadBySlug: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((slug) =>
          productService.getBySlug(slug).pipe(
            tapResponse({
              next: (product) => patchState(store, { product, loading: false }),
              error: (err: HttpErrorResponse) =>
                patchState(store, {
                  loading: false,
                  error: err.error?.message ?? 'Product not found',
                }),
            }),
          ),
        ),
      ),
    ),
  })),
);
