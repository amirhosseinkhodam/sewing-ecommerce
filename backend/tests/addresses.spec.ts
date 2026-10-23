import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { Role } from '../src/generated/prisma/client';
import { createSession } from './helpers/auth';
import { createTestApp, resetDatabase } from './helpers/app';

const BODY = {
  label: 'Home',
  province: 'Tehran',
  city: 'Tehran',
  fullAddress: 'Valiasr St. 1',
  postalCode: '1234567890',
  phone: '09121111111',
};

describe('addresses', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let bearer: string;
  let otherBearer: string;
  let userId: string;

  const http = () => request(app.getHttpServer());
  const create = (token: string, extra: object = {}) =>
    http()
      .post('/api/addresses')
      .set('Authorization', token)
      .send({ ...BODY, ...extra });
  const list = (token: string) =>
    http().get('/api/addresses').set('Authorization', token);

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const customer = await createSession(app, prisma, Role.CUSTOMER);
    bearer = customer.bearer;
    userId = customer.user.id;
    otherBearer = (
      await createSession(app, prisma, Role.CUSTOMER, '09122222222')
    ).bearer;
  });

  it('requires authentication', async () => {
    expect((await http().get('/api/addresses')).status).toBe(401);
    expect((await http().post('/api/addresses').send(BODY)).status).toBe(401);
  });

  it('makes the first address the default even when not asked', async () => {
    const res = await create(bearer);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ label: 'Home', isDefault: true });
  });

  it('keeps the first as default when a second is added without isDefault', async () => {
    await create(bearer);
    await create(bearer, { label: 'Work' });

    const res = await list(bearer);

    const byLabel = Object.fromEntries(
      res.body.map((a: { label: string; isDefault: boolean }) => [
        a.label,
        a.isDefault,
      ]),
    );
    expect(byLabel).toEqual({ Home: true, Work: false });
  });

  it('moves the default when a new address asks for it', async () => {
    await create(bearer);
    await create(bearer, { label: 'Work', isDefault: true });

    const res = await list(bearer);

    expect(
      res.body.filter((a: { isDefault: boolean }) => a.isDefault),
    ).toHaveLength(1);
    expect(res.body[0].label).toBe('Work');
  });

  it('moves the default on update and keeps exactly one', async () => {
    const first = await create(bearer);
    const second = await create(bearer, { label: 'Work' });

    const res = await http()
      .patch(`/api/addresses/${second.body.id}`)
      .set('Authorization', bearer)
      .send({ isDefault: true });

    expect(res.status).toBe(200);
    const rows = await prisma.address.findMany({ where: { userId } });
    expect(rows.filter((a) => a.isDefault).map((a) => a.id)).toEqual([
      second.body.id,
    ]);
    expect(rows.find((a) => a.id === first.body.id)?.isDefault).toBe(false);
  });

  it('lists the default first', async () => {
    await create(bearer, { label: 'A' });
    await create(bearer, { label: 'B' });
    await create(bearer, { label: 'C', isDefault: true });

    const res = await list(bearer);

    expect(res.body[0].label).toBe('C');
  });

  it('updates only the fields sent', async () => {
    const created = await create(bearer);

    const res = await http()
      .patch(`/api/addresses/${created.body.id}`)
      .set('Authorization', bearer)
      .send({ city: 'Karaj' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ city: 'Karaj', province: 'Tehran' });
  });

  it('deletes an address', async () => {
    const created = await create(bearer);

    const res = await http()
      .delete(`/api/addresses/${created.body.id}`)
      .set('Authorization', bearer);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true });
    expect((await list(bearer)).body).toEqual([]);
  });

  describe('validation', () => {
    it.each([
      ['an empty label', { label: '' }],
      ['a missing city', { city: undefined }],
      ['a landline phone', { phone: '02112345678' }],
      ['a short mobile', { phone: '0912123' }],
      ['a non-boolean isDefault', { isDefault: 'yes' }],
    ])('rejects %s', async (_label, extra) => {
      const res = await create(bearer, extra);

      expect(res.status).toBe(400);
    });

    it('rejects a bad phone on update too', async () => {
      const created = await create(bearer);

      const res = await http()
        .patch(`/api/addresses/${created.body.id}`)
        .set('Authorization', bearer)
        .send({ phone: '123' });

      expect(res.status).toBe(400);
    });

    it('ignores a client-supplied userId (no mass assignment)', async () => {
      const other = await prisma.user.findFirstOrThrow({
        where: { phone: '09122222222' },
      });

      const res = await create(bearer, { userId: other.id });

      expect(res.status).toBe(201);
      expect(await prisma.address.count({ where: { userId: other.id } })).toBe(
        0,
      );
      expect(await prisma.address.count({ where: { userId } })).toBe(1);
    });
  });

  describe('ownership', () => {
    it("never lists another user's addresses", async () => {
      await create(bearer);

      const res = await list(otherBearer);

      expect(res.body).toEqual([]);
    });

    it("cannot update or delete another user's address, and it survives", async () => {
      const created = await create(bearer);

      const patch = await http()
        .patch(`/api/addresses/${created.body.id}`)
        .set('Authorization', otherBearer)
        .send({ city: 'Hacked' });
      const del = await http()
        .delete(`/api/addresses/${created.body.id}`)
        .set('Authorization', otherBearer);

      expect(patch.status).toBe(404);
      expect(del.status).toBe(404);
      const row = await prisma.address.findUniqueOrThrow({
        where: { id: created.body.id },
      });
      expect(row.city).toBe('Tehran');
    });

    it('404s for an unknown id', async () => {
      const res = await http()
        .delete('/api/addresses/00000000-0000-4000-8000-000000000000')
        .set('Authorization', bearer);

      expect(res.status).toBe(404);
    });
  });
});
