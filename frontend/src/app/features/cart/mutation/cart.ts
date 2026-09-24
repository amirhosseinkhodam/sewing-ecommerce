import { inject } from '@angular/core';
import {
  injectMutation,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import type { AddCartItemPayloadModel } from '@domain/models/cart';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { injectMutationFeedback } from '@shared/utils/mutation-feedback';
import { CartService } from '../services/cart';

export interface UpdateCartItemModel {
  readonly itemId: string;
  readonly quantity: number;
}

export function injectAddCartItemMutation() {
  const cartService = inject(CartService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (payload: AddCartItemPayloadModel) =>
      firstValueFrom(cartService.addItem(payload)),
    // Every cart write returns the whole cart, so seed the cache rather than
    // invalidating and paying for a second round trip.
    onSuccess: (cart) => queryClient.setQueryData([QUERY_KEYS.cart], cart),
    onError: (error) => feedback.error(error, 'couldNotAddToCart'),
  }));
}

export function injectUpdateCartItemMutation() {
  const cartService = inject(CartService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: ({ itemId, quantity }: UpdateCartItemModel) =>
      firstValueFrom(cartService.updateItem(itemId, { quantity })),
    onSuccess: (cart) => queryClient.setQueryData([QUERY_KEYS.cart], cart),
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}

export function injectRemoveCartItemMutation() {
  const cartService = inject(CartService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (itemId: string) =>
      firstValueFrom(cartService.removeItem(itemId)),
    onSuccess: (cart) => queryClient.setQueryData([QUERY_KEYS.cart], cart),
    onError: (error) => feedback.error(error, 'couldNotDelete'),
  }));
}
