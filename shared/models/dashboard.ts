import type { OrderStatus } from '../const/order-statuses';
import type { PaymentStatus } from '../const/payment-statuses';

/** A single point on the dashboard's revenue/orders trend. */
export interface TrendPointModel {
  /** ISO date of the day this bucket covers. */
  readonly date: string;
  readonly orders: number;
  /** Sum of `totalAmount` for paid orders on that day. */
  readonly revenue: string;
}

export interface StatusCountModel {
  readonly status: OrderStatus;
  readonly count: number;
}

export interface PaymentCountModel {
  readonly paymentStatus: PaymentStatus;
  readonly count: number;
}

export interface DashboardStatsModel {
  /** Inclusive day range the trend and status counts are scoped to. */
  readonly from: string;
  readonly to: string;
  readonly totalOrders: number;
  readonly totalCustomers: number;
  readonly totalProducts: number;
  readonly totalCategories: number;
  readonly totalPortfolioItems: number;
  readonly unreadMessages: number;
  /** Paid orders only, across the whole shop (not the range). */
  readonly totalRevenue: string;
  /** Paid orders inside the range, so the trend sums to this. */
  readonly rangeRevenue: string;
  readonly ordersInRange: number;
  readonly ordersByStatus: readonly StatusCountModel[];
  readonly paymentsByStatus: readonly PaymentCountModel[];
  readonly trend: readonly TrendPointModel[];
}
