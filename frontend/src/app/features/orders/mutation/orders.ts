import { inject } from '@angular/core';
import {
  injectMutation,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import type { CreateOrderPayloadModel, OrderModel } from '@domain/models/order';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { injectMutationFeedback } from '@shared/utils/mutation-feedback';
import { OrderService } from '../services/order';

export interface UploadReceiptModel {
  readonly id: string;
  readonly paymentReceipt: string;
}

/**
 * Placing or cancelling an order moves variant stock, so product reads go
 * stale alongside the order lists.
 */
function invalidateOrdersAndStock(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.adminOrders] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.products] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.product] }),
  ]);
}

export function injectCreateOrderMutation(options?: {
  readonly onSuccess?: (order: OrderModel) => void;
}) {
  const orderService = inject(OrderService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (payload: CreateOrderPayloadModel) =>
      firstValueFrom(orderService.create(payload)),
    onSuccess: async (order) => {
      await invalidateOrdersAndStock(queryClient);
      feedback.success('orderPlaced');
      options?.onSuccess?.(order);
    },
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}

export function injectUploadReceiptMutation() {
  const orderService = inject(OrderService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: ({ id, paymentReceipt }: UploadReceiptModel) =>
      firstValueFrom(orderService.uploadReceipt(id, paymentReceipt)),
    onSuccess: (order) => {
      queryClient.setQueryData([QUERY_KEYS.order, order.id], order);
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
      feedback.success('receiptUploaded');
    },
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}

export function injectCancelOrderMutation() {
  const orderService = inject(OrderService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(orderService.cancel(id)),
    onSuccess: async (order) => {
      queryClient.setQueryData([QUERY_KEYS.order, order.id], order);
      await invalidateOrdersAndStock(queryClient);
      feedback.success('orderCancelled');
    },
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}
