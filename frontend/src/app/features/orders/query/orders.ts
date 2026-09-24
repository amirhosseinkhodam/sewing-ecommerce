import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { type OrderListQueryModel, OrderService } from '../services/order';

/** The signed-in user's order history. */
export function injectOrdersQuery(
  params: () => OrderListQueryModel,
  enabled: () => boolean,
) {
  const orderService = inject(OrderService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.orders, params()],
    enabled: enabled(),
    queryFn: () => firstValueFrom(orderService.list(params())),
  }));
}

/** A single order. Idle until `id` returns a value. */
export function injectOrderQuery(id: () => string | null) {
  const orderService = inject(OrderService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.order, id()],
    enabled: !!id(),
    queryFn: () => firstValueFrom(orderService.get(id()!)),
  }));
}
