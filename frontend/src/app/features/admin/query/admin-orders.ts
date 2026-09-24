import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import {
  type AdminMessageQueryModel,
  AdminMessageService,
} from '../services/admin-message';
import {
  type AdminOrderQueryModel,
  AdminOrderService,
} from '../services/admin-order';

/** Admin order list across all customers. */
export function injectAdminOrdersQuery(
  params: () => AdminOrderQueryModel,
  enabled: () => boolean,
) {
  const orderService = inject(AdminOrderService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.adminOrders, params()],
    enabled: enabled(),
    queryFn: () => firstValueFrom(orderService.list(params())),
  }));
}

/** Admin order detail. Idle until `id` returns a value. */
export function injectAdminOrderQuery(id: () => string | null) {
  const orderService = inject(AdminOrderService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.adminOrder, id()],
    enabled: !!id(),
    queryFn: () => firstValueFrom(orderService.get(id()!)),
  }));
}

/** Contact messages, with the unread count the list header shows. */
export function injectAdminMessagesQuery(params: () => AdminMessageQueryModel) {
  const messageService = inject(AdminMessageService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.adminMessages, params()],
    queryFn: () => firstValueFrom(messageService.list(params())),
  }));
}
