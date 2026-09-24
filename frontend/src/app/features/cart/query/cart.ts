import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { CartService } from '../services/cart';

/** The signed-in user's cart. Idle for guests. */
export function injectCartQuery(enabled: () => boolean) {
  const cartService = inject(CartService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.cart],
    enabled: enabled(),
    queryFn: () => firstValueFrom(cartService.get()),
  }));
}
