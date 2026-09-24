import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminOrderModel,
  OrderModel,
  PaginatedOrdersModel,
} from '../../../shared/models/order';
import { OrderStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { UploadReceiptDto } from './dto/upload-receipt.dto';

/**
 * Legal status transitions (PLAN.md §7 "Order status lifecycle"). A terminal
 * status has no successors, so an admin cannot revive a delivered order.
 */
const STATUS_TRANSITIONS: Readonly<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const ORDER_INCLUDE = { items: true } satisfies Prisma.OrderInclude;

const ADMIN_ORDER_INCLUDE = {
  items: true,
  user: { select: { id: true, firstName: true, lastName: true, phone: true } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;
type AdminOrderRow = Prisma.OrderGetPayload<{
  include: typeof ADMIN_ORDER_INCLUDE;
}>;

@Injectable()
export class OrdersService {
  readonly #prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.#prisma = prisma;
  }

  async create(userId: string, dto: CreateOrderDto): Promise<OrderModel> {
    const cart = await this.#prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { name: true, price: true, images: true } },
            variant: { select: { size: true, stock: true, price: true } },
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const address = await this.#prisma.address.findFirst({
      where: { id: dto.shippingAddressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    for (const item of cart.items) {
      if (item.quantity > item.variant.stock) {
        throw new BadRequestException('Insufficient stock');
      }
    }

    const order = await this.#prisma.$transaction(async (tx) => {
      const totalAmount = cart.items.reduce(
        (sum, item) =>
          sum +
          Number(item.variant.price ?? item.product.price) * item.quantity,
        0,
      );

      const created = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: 'PENDING',
          shippingMethod: dto.shippingMethod,
          shippingAddressId: dto.shippingAddressId,
          shippingLabel: address.label,
          shippingProvince: address.province,
          shippingCity: address.city,
          shippingFullAddress: address.fullAddress,
          shippingPostalCode: address.postalCode,
          shippingPhone: address.phone,
          paymentMethod: dto.paymentMethod,
          paymentStatus: 'PENDING',
          notes: dto.notes,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.product.name,
              productImage:
                ((item.product.images as string[])[0] as string | undefined) ??
                null,
              size: item.variant.size,
              quantity: item.quantity,
              unitPrice: item.variant.price ?? item.product.price,
              totalPrice:
                Number(item.variant.price ?? item.product.price) *
                item.quantity,
            })),
          },
        },
        include: ORDER_INCLUDE,
      });

      await Promise.all(
        cart.items.map((item) =>
          tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          }),
        ),
      );

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    return this.#toModel(order);
  }

  async findAllForUser(
    userId: string,
    query: OrderQueryDto,
  ): Promise<PaginatedOrdersModel> {
    const where: Prisma.OrderWhereInput = { userId };
    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;

    const [items, total] = await Promise.all([
      this.#prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.#prisma.order.count({ where }),
    ]);

    return {
      items: items.map((order) => this.#toModel(order)),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async findOneForUser(userId: string, id: string): Promise<OrderModel> {
    const order = await this.#prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    // A missing order and someone else's order are both 404s, so order ids
    // cannot be probed for existence.
    if (order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    return this.#toModel(order);
  }

  async findAllForAdmin(
    query: OrderQueryDto,
  ): Promise<PaginatedOrdersModel<AdminOrderModel>> {
    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        {
          user: {
            firstName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          user: { lastName: { contains: query.search, mode: 'insensitive' } },
        },
        { user: { phone: { contains: query.search } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.#prisma.order.findMany({
        where,
        include: ADMIN_ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.#prisma.order.count({ where }),
    ]);

    return {
      items: items.map((order) => this.#toAdminModel(order)),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async findOneForAdmin(id: string): Promise<AdminOrderModel> {
    const order = await this.#prisma.order.findUnique({
      where: { id },
      include: ADMIN_ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.#toAdminModel(order);
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<AdminOrderModel> {
    const order = await this.#prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    this.#assertTransitionAllowed(order.status, dto.status);

    // Cancelling releases the stock that order creation reserved.
    if (dto.status === 'CANCELLED') {
      const updated = await this.#prisma.$transaction(async (tx) => {
        await this.#restoreStock(tx, id);
        return tx.order.update({
          where: { id },
          data: { status: dto.status, trackingCode: dto.trackingCode },
          include: ADMIN_ORDER_INCLUDE,
        });
      });
      return this.#toAdminModel(updated);
    }

    const updated = await this.#prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.trackingCode !== undefined
          ? { trackingCode: dto.trackingCode }
          : {}),
      },
      include: ADMIN_ORDER_INCLUDE,
    });
    return this.#toAdminModel(updated);
  }

  async updatePaymentStatus(
    id: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<AdminOrderModel> {
    const order = await this.#prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Confirming a card-to-card payment moves a pending order forward in the
    // same step, so admins don't have to remember two clicks.
    const advance = dto.paymentStatus === 'PAID' && order.status === 'PENDING';

    const updated = await this.#prisma.order.update({
      where: { id },
      data: {
        paymentStatus: dto.paymentStatus,
        ...(advance ? { status: OrderStatus.CONFIRMED } : {}),
      },
      include: ADMIN_ORDER_INCLUDE,
    });
    return this.#toAdminModel(updated);
  }

  async uploadReceipt(
    userId: string,
    id: string,
    dto: UploadReceiptDto,
  ): Promise<OrderModel> {
    const order = await this.#prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Order is already paid');
    }
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Order is cancelled');
    }
    if (order.paymentMethod !== 'CARD_TO_CARD') {
      throw new BadRequestException(
        'Receipts apply to card-to-card orders only',
      );
    }

    const updated = await this.#prisma.order.update({
      where: { id },
      data: { paymentReceipt: dto.paymentReceipt },
      include: ORDER_INCLUDE,
    });
    return this.#toModel(updated);
  }

  /** Customers may cancel only while nothing has shipped. */
  async cancelOwn(userId: string, id: string): Promise<OrderModel> {
    const order = await this.#prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      throw new ForbiddenException('Order can no longer be cancelled');
    }

    const updated = await this.#prisma.$transaction(async (tx) => {
      await this.#restoreStock(tx, id);
      return tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
        include: ORDER_INCLUDE,
      });
    });
    return this.#toModel(updated);
  }

  /**
   * Returns a cancelled order's items to stock. Prefers the recorded
   * `variantId`; falls back to (productId, size) for rows placed before that
   * column existed, which is ambiguous when a product has duplicate sizes.
   */
  async #restoreStock(tx: Prisma.TransactionClient, orderId: string) {
    const items = await tx.orderItem.findMany({ where: { orderId } });
    await Promise.all(
      items.map((item) =>
        item.variantId
          ? tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            })
          : tx.productVariant.updateMany({
              where: { productId: item.productId, size: item.size },
              data: { stock: { increment: item.quantity } },
            }),
      ),
    );
  }

  #assertTransitionAllowed(from: OrderStatus, to: OrderStatus): void {
    if (from === to) return;
    if (!STATUS_TRANSITIONS[from].includes(to)) {
      throw new BadRequestException(
        `Cannot change order status from ${from} to ${to}`,
      );
    }
  }

  #toModel(order: OrderRow): OrderModel {
    return {
      id: order.id,
      userId: order.userId,
      shippingAddressId: order.shippingAddressId,
      shippingAddress: {
        label: order.shippingLabel,
        province: order.shippingProvince,
        city: order.shippingCity,
        fullAddress: order.shippingFullAddress,
        postalCode: order.shippingPostalCode,
        phone: order.shippingPhone,
      },
      totalAmount: String(order.totalAmount),
      status: order.status,
      shippingMethod: order.shippingMethod,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentReceipt: order.paymentReceipt ?? undefined,
      trackingCode: order.trackingCode ?? undefined,
      notes: order.notes ?? undefined,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        size: item.size,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
        totalPrice: String(item.totalPrice),
      })),
    };
  }

  #toAdminModel(order: AdminOrderRow): AdminOrderModel {
    return {
      ...this.#toModel(order),
      customer: {
        id: order.user.id,
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        phone: order.user.phone,
      },
    };
  }
}
