import { DOCUMENT, inject } from '@angular/core';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { injectMutationFeedback } from '@shared/utils/mutation-feedback';
import { PaymentService } from '../services/payment';

/**
 * Opens an online payment attempt and leaves the app for the gateway. A full
 * page navigation, not a router one: the gateway is another site (or, with the
 * fake provider, a backend-rendered page). Nothing is cached here — the
 * gateway sends the browser back to `/orders/:id`, which loads fresh.
 */
export function injectStartPaymentMutation(options?: {
  readonly onError?: () => void;
}) {
  const paymentService = inject(PaymentService);
  const document = inject(DOCUMENT);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (orderId: string) =>
      firstValueFrom(paymentService.start(orderId)),
    onSuccess: ({ redirectUrl }) => document.location.assign(redirectUrl),
    onError: (error) => {
      feedback.error(error, 'couldNotStartPayment');
      options?.onError?.();
    },
  }));
}
