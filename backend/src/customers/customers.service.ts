import { Injectable } from '@nestjs/common';
import type { PaginatedCustomersModel } from '../../../shared/models/customer';
import { PrismaService } from '../common/prisma/prisma.service';
import { OrderStatus, Prisma } from '../generated/prisma/client';
import { CustomerQueryDto } from './dto/customer-query.dto';

type OrderAggregate = {
  userId: string;
  _count: { _all: number };
  _sum: { totalAmount: Prisma.Decimal | null };
};

@Injectable()
export class CustomersService {
  readonly #prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.#prisma = prisma;
  }

  /**
   * Order figures are aggregated with one `groupBy` over the page's users
   * rather than included per row, so the list stays a fixed two queries no
   * matter how many orders a customer has. Cancelled orders are excluded from
   * both the count and the spend.
   */
  async findAll(query: CustomerQueryDto): Promise<PaginatedCustomersModel> {
    const where: Prisma.UserWhereInput = { role: query.role };
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.#prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.#prisma.user.count({ where }),
    ]);

    const aggregates = await this.#orderAggregatesByUser(
      users.map((user) => user.id),
    );

    return {
      items: users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        orderCount: aggregates.get(user.id)?._count._all ?? 0,
        totalSpent: String(aggregates.get(user.id)?._sum.totalAmount ?? 0),
        createdAt: user.createdAt.toISOString(),
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async #orderAggregatesByUser(userIds: string[]) {
    const aggregates = new Map<string, OrderAggregate>();
    if (userIds.length === 0) {
      return aggregates;
    }

    const rows = await this.#prisma.order.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        status: { not: OrderStatus.CANCELLED },
      },
      _count: { _all: true },
      _sum: { totalAmount: true },
    });

    for (const row of rows as OrderAggregate[]) {
      aggregates.set(row.userId, row);
    }
    return aggregates;
  }
}
