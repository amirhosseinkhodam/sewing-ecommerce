import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@sewing.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';

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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
