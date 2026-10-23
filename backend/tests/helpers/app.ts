import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/configure-app';
import { PrismaService } from '../../src/common/prisma/prisma.service';

const UNLIMITED_HIT = {
  totalHits: 1,
  timeToExpire: 0,
  isBlocked: false,
  timeToBlockExpire: 0,
};

/**
 * Rate limiting is off by default: the per-route limits (register 5/min, ...)
 * would make unrelated tests flaky. Pass `{ throttle: true }` to test the limits.
 */
export async function createTestApp({ throttle = false } = {}) {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  if (!throttle) {
    builder
      .overrideProvider(ThrottlerStorage)
      .useValue({ increment: () => Promise.resolve(UNLIMITED_HIT) });
  }
  const moduleRef = await builder.compile();
  const app: INestApplication = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

/** Empties every table so each test starts from a known state. */
export async function resetDatabase(prisma: PrismaService) {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (!tables.length) return;
  const list = tables.map((t) => `"${t.tablename}"`).join(', ');
  // TRUNCATE ... CASCADE across all tables is not expressible in Prisma.
  await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}
