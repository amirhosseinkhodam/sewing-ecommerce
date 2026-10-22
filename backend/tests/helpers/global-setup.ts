import 'dotenv/config';
import { execSync } from 'child_process';

export default function globalSetup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('DATABASE_URL_TEST is not set');
  if (url === process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL_TEST must differ from DATABASE_URL');
  }
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
