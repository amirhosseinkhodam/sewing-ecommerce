import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  Role,
  ShippingMethod,
} from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SETTINGS_ID = 'default';

const isProduction = process.env.NODE_ENV === 'production';
/** Demo data defaults on in development and off in production; SEED_DEMO overrides. */
const seedDemo = (process.env.SEED_DEMO ?? String(!isProduction)) === 'true';

async function main() {
  await prisma.shopSetting.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: {
      id: SETTINGS_ID,
      shopName: 'خیاطی',
      bankCardNumber: '6037-9911-2233-4455',
      bankCardHolder: 'فروشگاه خیاطی',
      shopPhone: '021-12345678',
      shopEmail: 'info@sewing.local',
      shopAddress: 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
      businessHours: 'شنبه تا پنجشنبه، ۹ صبح تا ۸ شب',
      postPrice: 60000,
      postEtaDays: 5,
      courierPrice: 180000,
      courierEtaDays: 2,
    },
  });
  // eslint-disable-next-line no-console
  console.log('Shop settings seeded.');

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@sewing.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';
  // Never let a production database get an admin with the well-known default.
  if (isProduction && !process.env.SEED_ADMIN_PASSWORD) {
    throw new Error('SEED_ADMIN_PASSWORD must be set when NODE_ENV=production');
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'Sewing',
      email: adminEmail,
      phone: '09120000000',
      password: await bcrypt.hash(adminPassword, 10),
      role: Role.ADMIN,
    },
  });

  console.log(`Admin user ready: ${adminEmail}`);

  // Demo catalog, customers (shared known password), and orders are for local
  // development only.
  if (!seedDemo) return;

  const categories = [
    { name: 'مردانه', slug: 'men', sortOrder: 1 },
    { name: 'زنانه', slug: 'women', sortOrder: 2 },
    { name: 'بچگانه', slug: 'kids', sortOrder: 3 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  // eslint-disable-next-line no-console
  console.log('Sample categories seeded.');

  const products = [
    {
      name: 'پیراهن مردانه کلاسیک',
      slug: 'men-classic-shirt',
      description: 'پیراهن مردانه کلاسیک با پارچه نخی درجه یک و دوخت تمیز',
      price: 850000,
      fabric: 'نخی',
      categorySlug: 'men',
      isFeatured: true,
      variants: [
        { size: 'M', stock: 10 },
        { size: 'L', stock: 8 },
        { size: 'XL', stock: 5 },
      ],
    },
    {
      name: 'کتوشلوار رسمی',
      slug: 'formal-suit',
      description: 'کت و شلوار رسمی با پارچه فاستونی، مناسب مراسم و جلسات',
      price: 3200000,
      fabric: 'فاستونی',
      categorySlug: 'men',
      isFeatured: true,
      variants: [
        { size: 'M', stock: 4 },
        { size: 'L', stock: 6 },
      ],
    },
    {
      name: 'مانتو زنانه تابستانی',
      slug: 'women-summer-manteau',
      description: 'مانتو زنانه سبک و خنک مناسب فصل تابستان',
      price: 1250000,
      fabric: 'کتان',
      categorySlug: 'women',
      isFeatured: true,
      variants: [
        { size: 'S', stock: 7 },
        { size: 'M', stock: 9 },
        { size: 'L', stock: 3 },
      ],
    },
    {
      name: 'لباس مجلسی زنانه',
      slug: 'women-evening-dress',
      description: 'لباس مجلسی زنانه با پارچه ساتن و طراحی شیک',
      price: 2500000,
      fabric: 'ساتن',
      categorySlug: 'women',
      isFeatured: false,
      variants: [
        { size: 'M', stock: 2 },
        { size: 'L', stock: 4 },
      ],
    },
    {
      name: 'شلوارک بچگانه',
      slug: 'kids-shorts',
      description: 'شلوارک بچگانه نخی و راحت برای بازی',
      price: 450000,
      fabric: 'نخی',
      categorySlug: 'kids',
      isFeatured: false,
      variants: [
        { size: 'XS', stock: 15 },
        { size: 'S', stock: 12 },
      ],
    },
  ];

  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: { slug: product.categorySlug },
    });
    if (!category) continue;

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        fabric: product.fabric,
        images: [],
        categoryId: category.id,
        isFeatured: product.isFeatured,
        variants: {
          create: product.variants,
        },
      },
    });
  }
  // eslint-disable-next-line no-console
  console.log('Sample products seeded.');

  await seedDemoOrders();
}

/**
 * The dashboard, customer list, and admin screens are only meaningful with
 * order history behind them, so a small set of demo customers and orders is
 * seeded. Orders are spread across the last few weeks and across the whole
 * status/payment lifecycle so the trend chart and the status breakdowns all
 * have something to show. Everything is keyed on a stable email, so re-running
 * the seed is idempotent.
 */
async function seedDemoOrders() {
  const settings = await prisma.shopSetting.findUnique({
    where: { id: SETTINGS_ID },
  });
  if (!settings) return;

  const seededProducts = await prisma.product.findMany({
    include: { variants: { take: 1 } },
  });
  if (seededProducts.length === 0) return;

  const password = await bcrypt.hash('customer123', 10);
  const demoCustomers = [
    {
      firstName: 'مریم',
      lastName: 'کریمی',
      email: 'maryam@sewing.local',
      phone: '09121110001',
    },
    {
      firstName: 'علی',
      lastName: 'رضایی',
      email: 'ali@sewing.local',
      phone: '09121110002',
    },
    {
      firstName: 'زهرا',
      lastName: 'موسوی',
      email: 'zahra@sewing.local',
      phone: '09121110003',
    },
  ];

  const users = [];
  for (const customer of demoCustomers) {
    const user = await prisma.user.upsert({
      where: { email: customer.email },
      update: {},
      create: { ...customer, password, role: Role.CUSTOMER },
    });
    users.push(user);

    await prisma.address.upsert({
      where: { id: `${user.id}-home` },
      update: {},
      create: {
        id: `${user.id}-home`,
        userId: user.id,
        label: 'خانه',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان ولیعصر، کوچه بهار، پلاک ۱۰',
        postalCode: '1234567890',
        phone: customer.phone,
        isDefault: true,
      },
    });
  }

  // (daysAgo, status, paymentStatus, shippingMethod) — a spread that exercises
  // every branch of the status lifecycle and both payment outcomes.
  const orderPlan = [
    { daysAgo: 27, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, shippingMethod: ShippingMethod.POST },
    { daysAgo: 21, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, shippingMethod: ShippingMethod.COURIER },
    { daysAgo: 15, status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.FAILED, shippingMethod: ShippingMethod.POST },
    { daysAgo: 11, status: OrderStatus.SHIPPED, paymentStatus: PaymentStatus.PAID, shippingMethod: ShippingMethod.COURIER },
    { daysAgo: 8, status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID, shippingMethod: ShippingMethod.POST },
    { daysAgo: 5, status: OrderStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID, shippingMethod: ShippingMethod.COURIER },
    { daysAgo: 3, status: OrderStatus.PENDING, paymentStatus: PaymentStatus.PENDING, shippingMethod: ShippingMethod.POST },
    { daysAgo: 1, status: OrderStatus.PENDING, paymentStatus: PaymentStatus.PENDING, shippingMethod: ShippingMethod.COURIER },
  ];

  let seededOrders = 0;
  for (const [index, plan] of orderPlan.entries()) {
    const user = users[index % users.length];
    const product = seededProducts[index % seededProducts.length];
    const variant = product.variants[0];
    if (!user || !variant) continue;

    // A stable per-order key so re-seeding does not duplicate rows.
    const orderId = `seed-order-${index + 1}`;
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (existing) continue;

    const address = await prisma.address.findUnique({
      where: { id: `${user.id}-home` },
    });
    if (!address) continue;

    const quantity = (index % 3) + 1;
    const unitPrice = Number(variant.price ?? product.price);
    const itemsSubtotal = unitPrice * quantity;
    const shippingAmount = Number(
      plan.shippingMethod === ShippingMethod.POST
        ? settings.postPrice
        : settings.courierPrice,
    );

    await prisma.order.create({
      data: {
        id: orderId,
        userId: user.id,
        totalAmount: itemsSubtotal + shippingAmount,
        shippingAmount,
        status: plan.status,
        shippingMethod: plan.shippingMethod,
        shippingAddressId: address.id,
        paymentMethod: PaymentMethod.CARD_TO_CARD,
        paymentStatus: plan.paymentStatus,
        shippingLabel: address.label,
        shippingProvince: address.province,
        shippingCity: address.city,
        shippingFullAddress: address.fullAddress,
        shippingPostalCode: address.postalCode,
        shippingPhone: address.phone,
        createdAt: new Date(Date.now() - plan.daysAgo * 24 * 60 * 60 * 1000),
        items: {
          create: {
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            productImage: null,
            size: variant.size,
            quantity,
            unitPrice,
            totalPrice: itemsSubtotal,
          },
        },
      },
    });
    seededOrders += 1;
  }

  // eslint-disable-next-line no-console
  console.log(
    `Demo customers and ${seededOrders} orders seeded (password: customer123).`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
