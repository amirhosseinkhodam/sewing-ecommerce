import type { OrderStatus } from '../const/order-statuses';
import type { PaymentMethod } from '../const/payment-methods';
import type { PaymentStatus } from '../const/payment-statuses';
import type { ShippingMethod } from '../const/shipping-methods';

export interface OrderItemModel {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly productImage: string | null;
  readonly size: string;
  readonly quantity: number;
  readonly unitPrice: string;
  readonly totalPrice: string;
}

export interface OrderModel {
  readonly id: string;
  readonly userId: string;
  readonly shippingAddressId: string;
  readonly totalAmount: string;
  readonly status: OrderStatus;
  readonly shippingMethod: ShippingMethod;
  readonly paymentMethod: PaymentMethod;
  readonly paymentStatus: PaymentStatus;
  readonly trackingCode?: string;
  readonly notes?: string;
  readonly createdAt: string;
  readonly items: OrderItemModel[];
}

export interface CreateOrderPayloadModel {
  readonly shippingMethod: ShippingMethod;
  readonly shippingAddressId: string;
  readonly paymentMethod: PaymentMethod;
  readonly notes?: string;
}
