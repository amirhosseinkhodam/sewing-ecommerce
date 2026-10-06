import type { PaymentMethod } from '../const/payment-methods';

/** Response of `GET /api/payment/methods`: what checkout may offer. */
export interface PaymentMethodsModel {
  readonly methods: PaymentMethod[];
}

/** Response of `POST /api/payment/:orderId/start`: where to send the browser. */
export interface PaymentStartResponseModel {
  readonly redirectUrl: string;
}
