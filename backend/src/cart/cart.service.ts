import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CartModel } from '../../../shared/models/cart';
import { PrismaService } from '../common/prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const CART_INCLUDE = {
  items: {
    orderBy: { createdAt: 'asc' },
    include: {
      product: {
        select: { name: true, slug: true, images: true, price: true },
      },
      variant: { select: { size: true, stock: true, price: true } },
    },
  },
} as const;

@Injectable()
export class CartService {
  readonly #prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.#prisma = prisma;
  }

  async find(userId: string): Promise<CartModel> {
    const cart = await this.#getOrCreateCart(userId);
    return this.#toCartModel(cart.id);
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartModel> {
    const cart = await this.#getOrCreateCart(userId);

    const variant = await this.#prisma.productVariant.findFirst({
      where: { id: dto.variantId, productId: dto.productId },
      include: { product: { select: { isActive: true } } },
    });
    if (!variant || !variant.product.isActive) {
      throw new NotFoundException('Product variant not found');
    }

    const existing = await this.#prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId,
      },
    });
    const requested = (existing?.quantity ?? 0) + dto.quantity;
    if (requested > variant.stock) {
      throw new BadRequestException('Insufficient stock');
    }

    await this.#prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: requested },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: dto.productId,
            variantId: dto.variantId,
            quantity: dto.quantity,
          },
        });
      }
    });

    return this.#toCartModel(cart.id);
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartModel> {
    const item = await this.#findOwnedItem(userId, itemId);
    if (dto.quantity > item.variant.stock) {
      throw new BadRequestException('Insufficient stock');
    }
    await this.#prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity },
    });
    return this.#toCartModel(item.cartId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartModel> {
    const item = await this.#findOwnedItem(userId, itemId);
    await this.#prisma.cartItem.delete({ where: { id: item.id } });
    return this.#toCartModel(item.cartId);
  }

  #getCartId(userId: string) {
    return this.#prisma.cart.findUnique({ where: { userId } });
  }

  async #getOrCreateCart(userId: string) {
    return this.#prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async #findOwnedItem(userId: string, itemId: string) {
    const cart = await this.#getCartId(userId);
    if (!cart) {
      throw new NotFoundException('Cart item not found');
    }
    const item = await this.#prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: {
        variant: { select: { stock: true } },
      },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    return item;
  }

  async #toCartModel(cartId: string): Promise<CartModel> {
    const cart = await this.#prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: CART_INCLUDE,
    });
    return {
      id: cart.id,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        productName: item.product.name,
        productSlug: item.product.slug,
        productImage: (item.product.images as string[])[0] ?? null,
        size: item.variant.size,
        unitPrice: String(item.variant.price ?? item.product.price),
        stock: item.variant.stock,
      })),
    };
  }
}
