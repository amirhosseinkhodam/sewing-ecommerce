import type { OrderItem, Prisma } from '../generated/prisma/client';

/**
 * Returns order items to stock. Prefers the recorded `variantId`; falls back
 * to (productId, size) for rows placed before that column existed, which is
 * ambiguous when a product has duplicate sizes.
 */
export async function restoreStock(
  tx: Prisma.TransactionClient,
  items: readonly Pick<
    OrderItem,
    'variantId' | 'productId' | 'size' | 'quantity'
  >[],
): Promise<void> {
  await Promise.all(
    items.map((item) =>
      tx.productVariant.updateMany({
        where: item.variantId
          ? { id: item.variantId }
          : { productId: item.productId, size: item.size },
        data: { stock: { increment: item.quantity } },
      }),
    ),
  );
}
