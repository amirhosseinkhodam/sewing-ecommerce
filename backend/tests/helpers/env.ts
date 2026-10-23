import 'dotenv/config';

const testUrl = process.env.DATABASE_URL_TEST;
if (!testUrl) throw new Error('DATABASE_URL_TEST is not set');

// Every test file talks to the test database, never the dev one.
process.env.DATABASE_URL = testUrl;
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';

// Pinned so results never depend on a developer's .env: online payment uses the
// in-memory fake gateway and SMS goes to a log provider the tests can spy on.
process.env.PAYMENT_PROVIDER = 'FAKE';
process.env.SMS_PROVIDER = 'LOG';
