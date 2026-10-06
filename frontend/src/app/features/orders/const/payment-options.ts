import {
  PAYMENT_METHODS,
  type PaymentMethod,
} from '@domain/const/payment-methods';

/** Label and checkout hint per payment method. */
export const PAYMENT_METHOD_KEYS: Readonly<
  Record<PaymentMethod, { readonly label: string; readonly hint: string }>
> = {
  [PAYMENT_METHODS.ONLINE]: {
    label: 'onlinePayment',
    hint: 'onlinePaymentInstructions',
  },
  [PAYMENT_METHODS.CARD_TO_CARD]: {
    label: 'cardToCard',
    hint: 'cardToCardInstructions',
  },
};
