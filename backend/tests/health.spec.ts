import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/app';

describe('health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('unknown route uses the { statusCode, message } error shape', async () => {
    const res = await request(app.getHttpServer()).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({ statusCode: 404, message: expect.any(String) }),
    );
  });
});
