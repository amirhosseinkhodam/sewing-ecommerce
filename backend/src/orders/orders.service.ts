import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { OrderModel } from '../../../shared/models/order';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

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
          paymentMethod: dto.paymentMethod,
          paymentStatus: 'PENDING',
          notes: dto.notes,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
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
        include: { items: true },
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

    return {
      id: order.id,
      userId: order.userId,
      shippingAddressId: order.shippingAddressId,
      totalAmount: String(order.totalAmount),
      status: order.status,
      shippingMethod: order.shippingMethod,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
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
}
