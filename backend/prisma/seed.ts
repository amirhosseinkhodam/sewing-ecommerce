import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@tailor.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'Tailor',
      email: adminEmail,
      phone: '09120000000',
      password: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
    },
  });
  // eslint-disable-next-line no-console
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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
