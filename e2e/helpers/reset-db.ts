import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../backend/src/generated/prisma/client';

// global-setup points DATABASE_URL at the test database for this process; refuse
// to truncate anything that is not exactly that database.
const url = process.env.DATABASE_URL;
if (!url || url !== process.env.DATABASE_URL_TEST) {
  throw new Error('Refusing to reset: DATABASE_URL is not DATABASE_URL_TEST');
}

/** Empties every table of the test database; the schema is left in place. */
async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
  try {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    const list = tables.map((t) => `"${t.tablename}"`).join(', ');
    // TRUNCATE ... CASCADE across all tables is not expressible in Prisma.
    await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
