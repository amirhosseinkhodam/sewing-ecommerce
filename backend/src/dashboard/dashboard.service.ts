import { Injectable } from '@nestjs/common';
import { eachDayOfInterval, format, startOfDay, subDays } from 'date-fns';
import { ORDER_STATUSES } from '../../../shared/const/order-statuses';
import { PAYMENT_STATUSES } from '../../../shared/const/payment-statuses';
import type {
  DashboardStatsModel,
  PaymentCountModel,
  StatusCountModel,
  TrendPointModel,
} from '../../../shared/models/dashboard';
import { PrismaService } from '../common/prisma/prisma.service';
import { OrderStatus, PaymentStatus, Prisma } from '../generated/prisma/client';
import { DashboardStatsQueryDto } from './dto/dashboard-stats-query.dto';

const dayKey = (date: Date) => format(date, 'yyyy-MM-dd');

@Injectable()
export class DashboardService {
  readonly #prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.#prisma = prisma;
  }

  async getStats(query: DashboardStatsQueryDto): Promise<DashboardStatsModel> {
    const to = new Date();
    const from = startOfDay(subDays(to, query.days - 1));

    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      totalCategories,
      totalPortfolioItems,
      unreadMessages,
      revenueAllTime,
      revenueInRange,
      ordersInRange,
      statusGroups,
      paymentGroups,
      ordersInWindow,
    ] = await Promise.all([
      this.#prisma.order.count(),
      this.#prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.#prisma.product.count(),
      this.#prisma.category.count(),
      this.#prisma.portfolio.count(),
      this.#prisma.contactMessage.count({ where: { isRead: false } }),
      this.#prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.PAID },
        _sum: { totalAmount: true },
      }),
      this.#prisma.order.aggregate({
        where: {
          paymentStatus: PaymentStatus.PAID,
          createdAt: { gte: from, lte: to },
        },
        _sum: { totalAmount: true },
      }),
      this.#prisma.order.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      this.#prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: from, lte: to } },
        _count: { _all: true },
      }),
      this.#prisma.order.groupBy({
        by: ['paymentStatus'],
        where: { createdAt: { gte: from, lte: to } },
        _count: { _all: true },
      }),
      this.#trendRows(from, to),
    ]);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      totalOrders,
      totalCustomers,
      totalProducts,
      totalCategories,
      totalPortfolioItems,
      unreadMessages,
      totalRevenue: String(revenueAllTime._sum.totalAmount ?? 0),
      rangeRevenue: String(revenueInRange._sum.totalAmount ?? 0),
      ordersInRange,
      ordersByStatus: this.#withStatusCounts(
        Object.values(ORDER_STATUSES),
        statusGroups.map((group) => ({
          status: group.status,
          count: group._count._all,
        })),
      ),
      paymentsByStatus: this.#withPaymentCounts(
        Object.values(PAYMENT_STATUSES),
        paymentGroups.map((group) => ({
          paymentStatus: group.paymentStatus,
          count: group._count._all,
        })),
      ),
      trend: this.#toTrend(from, to, ordersInWindow),
    };
  }

  /**
   * Daily buckets are built in memory from a narrow select rather than with
   * `date_trunc` raw SQL: this shop's order volume is small, and the range is
   * capped at a year, so the row count stays in the low thousands. The
   * returned series is dense — a day with no orders still emits a zero bucket
   * so the chart's axis does not skip gaps.
   */
  async #trendRows(from: Date, to: Date) {
    return this.#prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true, totalAmount: true, paymentStatus: true },
    });
  }

  #toTrend(
    from: Date,
    to: Date,
    rows: {
      createdAt: Date;
      totalAmount: Prisma.Decimal;
      paymentStatus: PaymentStatus;
    }[],
  ): TrendPointModel[] {
    const buckets = new Map<string, { orders: number; revenue: number }>();
    for (const day of eachDayOfInterval({ start: from, end: to })) {
      buckets.set(dayKey(day), { orders: 0, revenue: 0 });
    }

    for (const row of rows) {
      const bucket = buckets.get(dayKey(row.createdAt));
      if (!bucket) {
        continue;
      }
      bucket.orders += 1;
      if (row.paymentStatus === PaymentStatus.PAID) {
        bucket.revenue += Number(row.totalAmount);
      }
    }

    return [...buckets].map(([date, bucket]) => ({
      date,
      orders: bucket.orders,
      revenue: String(bucket.revenue),
    }));
  }

  /** Every status is reported, including the ones with no orders. */
  #withStatusCounts(
    all: readonly OrderStatus[],
    found: readonly StatusCountModel[],
  ): StatusCountModel[] {
    const counts = new Map(found.map((row) => [row.status, row.count]));
    return all.map((status) => ({ status, count: counts.get(status) ?? 0 }));
  }

  #withPaymentCounts(
    all: readonly PaymentStatus[],
    found: readonly PaymentCountModel[],
  ): PaymentCountModel[] {
    const counts = new Map(found.map((row) => [row.paymentStatus, row.count]));
    return all.map((paymentStatus) => ({
      paymentStatus,
      count: counts.get(paymentStatus) ?? 0,
    }));
  }
}
