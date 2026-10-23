import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { createTestApp, resetDatabase } from './helpers/app';

describe('rate limits', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const http = () => request(app.getHttpServer());

  /** Fires `count` requests in sequence and returns their status codes. */
  const burst = async (count: number, send: () => request.Test) => {
    const statuses: number[] = [];
    for (let i = 0; i < count; i += 1) statuses.push((await send()).status);
    return statuses;
  };

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp({ throttle: true }));
    await resetDatabase(prisma);
  });

  afterEach(async () => {
    await app.close();
  });

  it('limits login to 10 attempts a minute', async () => {
    const statuses = await burst(12, () =>
      http()
        .post('/api/auth/login')
        .send({ phone: '09121111111', password: 'wrong-password' }),
    );

    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(10)).toEqual([429, 429]);
  });

  it('limits registration to 5 a minute and creates nothing when blocked', async () => {
    const statuses = await burst(7, () =>
      http()
        .post('/api/auth/register')
        .send({
          firstName: 'A',
          lastName: 'B',
          phone: `0912000${Math.floor(1000 + Math.random() * 8999)}`,
          password: 'password123',
        }),
    );

    expect(statuses.filter((s) => s === 429).length).toBeGreaterThanOrEqual(2);
    expect(statuses.slice(5).every((s) => s === 429)).toBe(true);
    expect(await prisma.user.count()).toBeLessThanOrEqual(5);
  });

  it('limits the public contact form to 3 a minute and stores only the allowed ones', async () => {
    const statuses = await burst(5, () =>
      http()
        .post('/api/contact')
        .send({ name: 'Sara', phone: '09123334444', message: 'Hello' }),
    );

    expect(statuses).toEqual([201, 201, 201, 429, 429]);
    expect(await prisma.contactMessage.count()).toBe(3);
  });

  it('answers 429 with the standard { statusCode, message } error body', async () => {
    await burst(3, () =>
      http()
        .post('/api/contact')
        .send({ name: 'Sara', phone: '09123334444', message: 'Hello' }),
    );

    const res = await http()
      .post('/api/contact')
      .send({ name: 'Sara', phone: '09123334444', message: 'Hello' });

    expect(res.status).toBe(429);
    expect(res.body.statusCode).toBe(429);
    expect(typeof res.body.message).toBe('string');
  });

  it('keeps separate budgets per route', async () => {
    await burst(3, () =>
      http()
        .post('/api/contact')
        .send({ name: 'Sara', phone: '09123334444', message: 'Hello' }),
    );

    const res = await http()
      .post('/api/auth/login')
      .send({ phone: '09121111111', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });
});
