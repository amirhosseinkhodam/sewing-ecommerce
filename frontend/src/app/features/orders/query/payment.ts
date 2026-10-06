import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { PaymentService } from '../services/payment';

/**
 * Which payment methods checkout may offer. Online payment depends on the
 * backend's `PAYMENT_PROVIDER`, which only changes on a redeploy, so the
 * answer is kept for the whole session.
 */
export function injectPaymentMethodsQuery() {
  const paymentService = inject(PaymentService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.paymentMethods],
    staleTime: Infinity,
    queryFn: () => firstValueFrom(paymentService.methods()),
  }));
}
