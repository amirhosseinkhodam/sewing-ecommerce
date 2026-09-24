import { inject } from '@angular/core';
import {
  injectMutation,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import type { OrderStatus } from '@domain/const/order-statuses';
import type { PaymentStatus } from '@domain/const/payment-statuses';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { injectMutationFeedback } from '@shared/utils/mutation-feedback';
import { AdminOrderService } from '../services/admin-order';

export interface UpdateOrderStatusModel {
  readonly id: string;
  readonly status: OrderStatus;
  readonly trackingCode?: string;
}

export interface UpdatePaymentStatusModel {
  readonly id: string;
  readonly paymentStatus: PaymentStatus;
}

/**
 * The customer sees the same order, and cancelling restores variant stock,
 * so the customer lists and product reads drop alongside the admin ones.
 */
function invalidateAdminOrders(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.adminOrders] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.order] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.products] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.product] }),
  ]);
}

export function injectUpdateOrderStatusMutation() {
  const orderService = inject(AdminOrderService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: ({ id, status, trackingCode }: UpdateOrderStatusModel) =>
      firstValueFrom(orderService.updateStatus(id, status, trackingCode)),
    onSuccess: async (order) => {
      queryClient.setQueryData([QUERY_KEYS.adminOrder, order.id], order);
      await invalidateAdminOrders(queryClient);
      feedback.success('orderStatusUpdated');
    },
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}

export function injectUpdatePaymentStatusMutation() {
  const orderService = inject(AdminOrderService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: ({ id, paymentStatus }: UpdatePaymentStatusModel) =>
      firstValueFrom(orderService.updatePaymentStatus(id, paymentStatus)),
    onSuccess: async (order) => {
      queryClient.setQueryData([QUERY_KEYS.adminOrder, order.id], order);
      await invalidateAdminOrders(queryClient);
      feedback.success('paymentStatusUpdated');
    },
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}
