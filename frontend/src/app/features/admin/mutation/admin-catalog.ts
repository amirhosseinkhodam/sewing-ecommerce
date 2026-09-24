import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  injectMutation,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { injectMutationFeedback } from '@shared/utils/mutation-feedback';
import type {
  SaveCategoryModel,
  SaveProductModel,
} from '../../products/models/product';
import { AdminCategoryService } from '../services/admin-category';
import { AdminProductService } from '../services/admin-product';

/**
 * A catalog write changes what both the admin tables and the public catalog
 * show, so all four caches are dropped together.
 */
function invalidateCategories(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.adminCategories] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.products] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.product] }),
  ]);
}

function invalidateProducts(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.adminProducts] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.adminProduct] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.products] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.product] }),
  ]);
}

export function injectSaveCategoryMutation() {
  const categoryService = inject(AdminCategoryService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: ({ id, payload }: SaveCategoryModel) =>
      firstValueFrom(
        id
          ? categoryService.update(id, payload)
          : categoryService.create(payload),
      ),
    onSuccess: async () => {
      await invalidateCategories(queryClient);
      feedback.success('categorySaved');
    },
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}

export function injectRemoveCategoryMutation() {
  const categoryService = inject(AdminCategoryService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(categoryService.remove(id)),
    onSuccess: async () => {
      await invalidateCategories(queryClient);
      feedback.success('categoryDeleted');
    },
    onError: (error) => {
      // The backend returns 409 when products or portfolio items still
      // reference the category; that needs its own explanation.
      if (error instanceof HttpErrorResponse && error.status === 409) {
        feedback.errorMessage('cannotDeleteCategory');
        return;
      }
      feedback.error(error, 'couldNotDelete');
    },
  }));
}

export function injectSaveProductMutation(options?: {
  readonly onSuccess?: () => void;
}) {
  const productService = inject(AdminProductService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: ({ id, payload }: SaveProductModel) =>
      firstValueFrom(
        id
          ? productService.update(id, payload)
          : productService.create(payload),
      ),
    onSuccess: async () => {
      await invalidateProducts(queryClient);
      feedback.success('productSaved');
      options?.onSuccess?.();
    },
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}

export function injectRemoveProductMutation() {
  const productService = inject(AdminProductService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(productService.remove(id)),
    onSuccess: async () => {
      await invalidateProducts(queryClient);
      feedback.success('productDeleted');
    },
    onError: (error) => feedback.error(error, 'couldNotDelete'),
  }));
}
