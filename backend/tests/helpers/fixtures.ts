import { PrismaService } from '../../src/common/prisma/prisma.service';

let counter = 0;
const next = () => (counter += 1);

export const POST_PRICE = 50000;
export const COURIER_PRICE = 90000;

/** The settings row is a singleton that checkout reads shipping rates from. */
export function seedSettings(prisma: PrismaService) {
  return prisma.shopSetting.create({
    data: {
      id: 'default',
      shopName: 'Test Shop',
      bankCardNumber: '6037991111111111',
      bankCardHolder: 'Test Holder',
      shopPhone: '02112345678',
      shopAddress: 'Tehran',
      businessHours: '9-17',
      postPrice: POST_PRICE,
      postEtaDays: 5,
      courierPrice: COURIER_PRICE,
      courierEtaDays: 2,
    },
  });
}

interface VariantOptions {
  readonly price?: number;
  readonly stock?: number;
  readonly variantPrice?: number | null;
  readonly isActive?: boolean;
  readonly size?: string;
}

/** A category, a product and one variant, each with a unique slug. */
export async function makeVariant(
  prisma: PrismaService,
  {
    price = 100000,
    stock = 10,
    variantPrice = null,
    isActive = true,
    size = 'M',
  }: VariantOptions = {},
) {
  const n = next();
  const category = await prisma.category.create({
    data: { name: `cat-${n}`, slug: `cat-${n}` },
  });
  const product = await prisma.product.create({
    data: {
      name: `product-${n}`,
      slug: `product-${n}`,
      price,
      images: [`/uploads/p${n}.png`],
      categoryId: category.id,
      isActive,
    },
  });
  const variant = await prisma.productVariant.create({
    data: { productId: product.id, size, stock, price: variantPrice },
  });
  return { category, product, variant };
}

export function makeAddress(
  prisma: PrismaService,
  userId: string,
  extra: object = {},
) {
  return prisma.address.create({
    data: {
      userId,
      label: 'Home',
      province: 'Tehran',
      city: 'Tehran',
      fullAddress: 'Valiasr St. 1',
      postalCode: '1234567890',
      phone: '09121111111',
      ...extra,
    },
  });
}
