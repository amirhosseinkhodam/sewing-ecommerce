import 'dotenv/config';
import { execSync } from 'child_process';

/** Brings the test database to a migrated, empty state seeded with settings and the admin. */
export default function globalSetup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('DATABASE_URL_TEST is not set');
  if (url === process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL_TEST must differ from DATABASE_URL');
  }
  const env = {
    ...process.env,
    DATABASE_URL: url,
    NODE_ENV: 'test',
    SEED_DEMO: 'false',
  };
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env });
  execSync('npx tsx e2e/helpers/reset-db.ts', { stdio: 'inherit', env });
  execSync('npx prisma db seed', { stdio: 'inherit', env });
}
