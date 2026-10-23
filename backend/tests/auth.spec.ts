import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { Role } from '../src/generated/prisma/client';
import { createTestApp, resetDatabase } from './helpers/app';

const PASSWORD = 'password123';
const CUSTOMER = {
  firstName: 'Sara',
  lastName: 'Ahmadi',
  phone: '09123456789',
  password: PASSWORD,
};

describe('auth', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  describe('POST /api/auth/register', () => {
    it('creates a CUSTOMER, returns tokens and never exposes the password', async () => {
      const res = await http().post('/api/auth/register').send(CUSTOMER);

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.refreshToken).toEqual(expect.any(String));
      expect(res.body.user).toEqual(
        expect.objectContaining({
          phone: CUSTOMER.phone,
          firstName: CUSTOMER.firstName,
          role: Role.CUSTOMER,
        }),
      );
      expect(res.body.user).not.toHaveProperty('password');

      const stored = await prisma.user.findUniqueOrThrow({
        where: { phone: CUSTOMER.phone },
      });
      expect(stored.password).not.toBe(PASSWORD);
      expect(await bcrypt.compare(PASSWORD, stored.password)).toBe(true);
    });

    it('rejects a duplicate phone with 409', async () => {
      await http().post('/api/auth/register').send(CUSTOMER);
      const res = await http().post('/api/auth/register').send(CUSTOMER);

      expect(res.status).toBe(409);
      expect(res.body.statusCode).toBe(409);
      expect(await prisma.user.count()).toBe(1);
    });

    it('rejects a non-Iranian-mobile phone', async () => {
      const res = await http()
        .post('/api/auth/register')
        .send({ ...CUSTOMER, phone: '12345' });

      expect(res.status).toBe(400);
      expect(await prisma.user.count()).toBe(0);
    });

    it('rejects a password shorter than 8 characters', async () => {
      const res = await http()
        .post('/api/auth/register')
        .send({ ...CUSTOMER, password: 'short' });

      expect(res.status).toBe(400);
    });

    it('ignores a client-supplied role (no mass assignment)', async () => {
      const res = await http()
        .post('/api/auth/register')
        .send({ ...CUSTOMER, role: Role.ADMIN });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe(Role.CUSTOMER);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await prisma.user.create({
        data: { ...CUSTOMER, password: await bcrypt.hash(PASSWORD, 4) },
      });
    });

    it('returns tokens and the public user for valid credentials', async () => {
      const res = await http()
        .post('/api/auth/login')
        .send({ phone: CUSTOMER.phone, password: PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.refreshToken).toEqual(expect.any(String));
      expect(res.body.user.phone).toBe(CUSTOMER.phone);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('rejects a wrong password and an unknown phone identically', async () => {
      const wrongPassword = await http()
        .post('/api/auth/login')
        .send({ phone: CUSTOMER.phone, password: 'wrong-password' });
      const unknownPhone = await http()
        .post('/api/auth/login')
        .send({ phone: '09999999999', password: PASSWORD });

      expect(wrongPassword.status).toBe(401);
      expect(unknownPhone.status).toBe(401);
      expect(unknownPhone.body.message).toBe(wrongPassword.body.message);
    });

    it('rejects a malformed phone with 400', async () => {
      const res = await http()
        .post('/api/auth/login')
        .send({ phone: 'abc', password: PASSWORD });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('exchanges a refresh token for a new pair', async () => {
      const { body: session } = await http()
        .post('/api/auth/register')
        .send(CUSTOMER);

      const res = await http()
        .post('/api/auth/refresh')
        .send({ refreshToken: session.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.refreshToken).toEqual(expect.any(String));
      expect(res.body.user.phone).toBe(CUSTOMER.phone);
    });

    it('rejects an access token, a garbage token and a missing token', async () => {
      const { body: session } = await http()
        .post('/api/auth/register')
        .send(CUSTOMER);

      const withAccess = await http()
        .post('/api/auth/refresh')
        .send({ refreshToken: session.accessToken });
      const garbage = await http()
        .post('/api/auth/refresh')
        .send({ refreshToken: 'not-a-jwt' });
      const missing = await http().post('/api/auth/refresh').send({});

      expect(withAccess.status).toBe(401);
      expect(garbage.status).toBe(401);
      expect(missing.status).toBe(400);
    });
  });

  describe('GET /api/auth/me and PATCH /api/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      const res = await http().post('/api/auth/register').send(CUSTOMER);
      accessToken = res.body.accessToken;
    });

    it('requires a valid bearer token', async () => {
      const none = await http().get('/api/auth/me');
      const bad = await http()
        .get('/api/auth/me')
        .set('Authorization', 'Bearer nope');

      expect(none.status).toBe(401);
      expect(bad.status).toBe(401);
    });

    it('returns the current user without the password', async () => {
      const res = await http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.phone).toBe(CUSTOMER.phone);
      expect(res.body).not.toHaveProperty('password');
    });

    it('updates the profile and cannot escalate the role', async () => {
      const res = await http()
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName: 'Mina', role: Role.ADMIN });

      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe('Mina');
      expect(res.body.role).toBe(Role.CUSTOMER);
    });

    it('hashes a changed password and the new one logs in', async () => {
      const res = await http()
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'new-password-1' });
      expect(res.status).toBe(200);

      const oldLogin = await http()
        .post('/api/auth/login')
        .send({ phone: CUSTOMER.phone, password: PASSWORD });
      const newLogin = await http()
        .post('/api/auth/login')
        .send({ phone: CUSTOMER.phone, password: 'new-password-1' });

      expect(oldLogin.status).toBe(401);
      expect(newLogin.status).toBe(200);
    });
  });

  describe('role guard', () => {
    it('lets only ADMIN reach /api/admin/customers', async () => {
      const customer = await http().post('/api/auth/register').send(CUSTOMER);
      await prisma.user.create({
        data: {
          firstName: 'Admin',
          lastName: 'User',
          phone: '09120000000',
          password: await bcrypt.hash(PASSWORD, 4),
          role: Role.ADMIN,
        },
      });
      const admin = await http()
        .post('/api/auth/login')
        .send({ phone: '09120000000', password: PASSWORD });

      const anonymous = await http().get('/api/admin/customers');
      const asCustomer = await http()
        .get('/api/admin/customers')
        .set('Authorization', `Bearer ${customer.body.accessToken}`);
      const asAdmin = await http()
        .get('/api/admin/customers')
        .set('Authorization', `Bearer ${admin.body.accessToken}`);

      expect(anonymous.status).toBe(401);
      expect(asCustomer.status).toBe(403);
      expect(asAdmin.status).toBe(200);
    });
  });
});
