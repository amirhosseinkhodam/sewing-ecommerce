import 'dotenv/config';
import { defineConfig } from '@playwright/test';

const PORT = 3100;
const testUrl = process.env.DATABASE_URL_TEST;
if (!testUrl) throw new Error('DATABASE_URL_TEST is not set');
if (testUrl === process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL_TEST must differ from DATABASE_URL');
}

/**
 * Journeys run against the production build served by the Nest backend on one
 * origin, backed by the test database and the fake payment gateway. Run
 * `npm run build` first (the `test:e2e` script does).
 */
export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/helpers/global-setup.ts',
  // One database, so journeys run one after another.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // Optional: use an already-installed Chromium instead of the bundled one.
    launchOptions: {
      executablePath: process.env.E2E_CHROMIUM_PATH || undefined,
    },
  },
  projects: [
    { name: 'en', use: { locale: 'en-US' }, metadata: { language: 'en' } },
    { name: 'fa', use: { locale: 'fa-IR' }, metadata: { language: 'fa' } },
  ],
  webServer: {
    command: 'node dist/backend/src/main',
    url: `http://localhost:${PORT}/api/payment/methods`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      PORT: String(PORT),
      DATABASE_URL: testUrl,
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: 'e2e-access-secret',
      JWT_REFRESH_SECRET: 'e2e-refresh-secret',
      PAYMENT_PROVIDER: 'FAKE',
      SMS_PROVIDER: 'LOG',
      PUBLIC_URL: `http://localhost:${PORT}`,
    },
  },
});
