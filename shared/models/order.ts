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

/** Address as captured when the order was placed, not as it exists today. */
export interface OrderShippingAddressModel {
  readonly label: string;
  readonly province: string;
  readonly city: string;
  readonly fullAddress: string;
  readonly postalCode: string | null;
  readonly phone: string;
}

export interface OrderModel {
  readonly id: string;
  readonly userId: string;
  readonly shippingAddressId: string;
  readonly shippingAddress: OrderShippingAddressModel;
  readonly totalAmount: string;
  readonly status: OrderStatus;
  readonly shippingMethod: ShippingMethod;
  readonly paymentMethod: PaymentMethod;
  readonly paymentStatus: PaymentStatus;
  readonly paymentReceipt?: string;
  readonly trackingCode?: string;
  readonly notes?: string;
  readonly createdAt: string;
  readonly items: OrderItemModel[];
}

/** Admin list rows carry the customer; the customer's own list does not. */
export interface AdminOrderModel extends OrderModel {
  readonly customer: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly phone: string;
  };
}

export interface CreateOrderPayloadModel {
  readonly shippingMethod: ShippingMethod;
  readonly shippingAddressId: string;
  readonly paymentMethod: PaymentMethod;
  readonly notes?: string;
}

export interface UpdateOrderStatusPayloadModel {
  readonly status: OrderStatus;
  readonly trackingCode?: string;
}

export interface UpdatePaymentStatusPayloadModel {
  readonly paymentStatus: PaymentStatus;
}

export interface UploadReceiptPayloadModel {
  readonly paymentReceipt: string;
}

export interface PaginatedOrdersModel<T = OrderModel> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
