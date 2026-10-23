import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { Role } from '../src/generated/prisma/client';
import { createSession } from './helpers/auth';
import { createTestApp, resetDatabase } from './helpers/app';
import { makeAddress, makeVariant, seedSettings } from './helpers/fixtures';

const MISSING = '00000000-0000-4000-8000-000000000000';

describe('portfolio, contact and admin', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string;
  let customer: string;
  let customerId: string;

  const http = () => request(app.getHttpServer());
  const asAdmin = (req: request.Test) => req.set('Authorization', admin);

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    admin = (await createSession(app, prisma, Role.ADMIN)).bearer;
    const session = await createSession(app, prisma, Role.CUSTOMER);
    customer = session.bearer;
    customerId = session.user.id;
  });

  describe('portfolio', () => {
    const create = (body: object) =>
      asAdmin(http().post('/api/admin/portfolio')).send(body);

    it('admin-only management: 401 anonymous, 403 customer', async () => {
      const item = (await create({ title: 'Wedding dress' })).body;
      const calls = [
        ['post', '/api/admin/portfolio'],
        ['get', '/api/admin/portfolio'],
        ['get', `/api/admin/portfolio/${item.id}`],
        ['patch', `/api/admin/portfolio/${item.id}`],
        ['delete', `/api/admin/portfolio/${item.id}`],
      ] as const;

      for (const [method, url] of calls) {
        expect((await http()[method](url)).status).toBe(401);
        expect(
          (await http()[method](url).set('Authorization', customer)).status,
        ).toBe(403);
      }
    });

    it('creates with a generated slug and defaults', async () => {
      const res = await create({ title: 'Wedding dress' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: 'Wedding dress',
        isActive: true,
        images: [],
      });
      expect(res.body.slug).toBeTruthy();
    });

    it('keeps an explicit slug and rejects a duplicate with 409', async () => {
      const first = await create({ title: 'A', slug: 'same' });
      const second = await create({ title: 'B', slug: 'same' });

      expect(first.body.slug).toBe('same');
      expect(second.status).toBe(409);
    });

    it('rejects a missing title, a long title and an unknown category', async () => {
      expect((await create({})).status).toBe(400);
      expect((await create({ title: 'x'.repeat(201) })).status).toBe(400);
      expect((await create({ title: 'T', categoryId: MISSING })).status).toBe(
        400,
      );
      expect((await create({ title: 'T', categoryId: 'nope' })).status).toBe(
        400,
      );
    });

    it('attaches a category and can detach it with null on update', async () => {
      const category = await prisma.category.create({
        data: { name: 'Dresses', slug: 'dresses' },
      });
      const item = (await create({ title: 'T', categoryId: category.id })).body;
      expect(item.category).toMatchObject({ slug: 'dresses' });

      const res = await asAdmin(
        http().patch(`/api/admin/portfolio/${item.id}`),
      ).send({ categoryId: null });

      expect(res.status).toBe(200);
      expect(res.body.category).toBeNull();
    });

    it('updates only what is sent', async () => {
      const item = (
        await create({
          title: 'Old',
          description: 'keep',
          images: ['/uploads/a.png'],
        })
      ).body;

      const res = await asAdmin(
        http().patch(`/api/admin/portfolio/${item.id}`),
      ).send({ isActive: false });

      expect(res.body).toMatchObject({
        title: 'Old',
        description: 'keep',
        isActive: false,
        images: ['/uploads/a.png'],
      });
    });

    it('lists only active items publicly, by slug, filtered and paginated', async () => {
      const category = await prisma.category.create({
        data: { name: 'Dresses', slug: 'dresses' },
      });
      await create({
        title: 'Red coat',
        slug: 'red-coat',
        categoryId: category.id,
      });
      await create({ title: 'Blue coat', slug: 'blue-coat' });
      await create({ title: 'Hidden', slug: 'hidden', isActive: false });

      const all = await http().get('/api/portfolio');
      const byCategory = await http().get('/api/portfolio?category=dresses');
      const search = await http().get('/api/portfolio?search=BLUE');
      const paged = await http().get('/api/portfolio?pageSize=1');
      const admins = await asAdmin(http().get('/api/admin/portfolio'));

      expect(all.body.total).toBe(2);
      expect(
        byCategory.body.items.map((i: { slug: string }) => i.slug),
      ).toEqual(['red-coat']);
      expect(search.body.total).toBe(1);
      expect(paged.body).toMatchObject({ total: 2, totalPages: 2 });
      expect(paged.body.items).toHaveLength(1);
      expect(admins.body.total).toBe(3);
    });

    it('serves an active item by slug and 404s an inactive or unknown one', async () => {
      await create({ title: 'Shown', slug: 'shown' });
      await create({ title: 'Hidden', slug: 'hidden', isActive: false });

      expect((await http().get('/api/portfolio/shown')).status).toBe(200);
      expect((await http().get('/api/portfolio/hidden')).status).toBe(404);
      expect((await http().get('/api/portfolio/nope')).status).toBe(404);
    });

    it('deletes an item and 404s afterwards', async () => {
      const item = (await create({ title: 'T' })).body;

      const del = await asAdmin(
        http().delete(`/api/admin/portfolio/${item.id}`),
      );
      const again = await asAdmin(
        http().delete(`/api/admin/portfolio/${item.id}`),
      );

      expect(del.body).toEqual({ deleted: true });
      expect(again.status).toBe(404);
    });
  });

  describe('contact', () => {
    const send = (body: object) => http().post('/api/contact').send(body);
    const valid = { name: 'Sara', phone: '09123334444', message: 'Hello' };

    it('accepts an anonymous submission and only acknowledges it', async () => {
      const res = await send(valid);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ submitted: true });
      expect(await prisma.contactMessage.count()).toBe(1);
    });

    it.each([
      ['an empty name', { name: '' }],
      ['a name over 120 chars', { name: 'x'.repeat(121) }],
      ['a landline phone', { phone: '02112345678' }],
      ['an empty message', { message: '' }],
      ['a message over 2000 chars', { message: 'x'.repeat(2001) }],
    ])('rejects %s', async (_label, extra) => {
      const res = await send({ ...valid, ...extra });

      expect(res.status).toBe(400);
      expect(await prisma.contactMessage.count()).toBe(0);
    });

    it('strips unexpected fields such as isRead instead of storing them', async () => {
      const res = await send({ ...valid, isRead: true });

      expect(res.status).toBe(201);
      expect((await prisma.contactMessage.findFirstOrThrow()).isRead).toBe(
        false,
      );
    });

    it('admin-only inbox: 401 anonymous, 403 customer', async () => {
      expect((await http().get('/api/admin/messages')).status).toBe(401);
      expect(
        (await http().get('/api/admin/messages').set('Authorization', customer))
          .status,
      ).toBe(403);
    });

    it('lists newest first with the unread count, and filters by isRead', async () => {
      await send(valid);
      await send({ ...valid, message: 'Second' });
      const rows = await prisma.contactMessage.findMany({
        orderBy: { createdAt: 'asc' },
      });
      await prisma.contactMessage.update({
        where: { id: rows[0].id },
        data: { isRead: true },
      });

      const all = await asAdmin(http().get('/api/admin/messages'));
      const unread = await asAdmin(
        http().get('/api/admin/messages?isRead=false'),
      );
      const read = await asAdmin(http().get('/api/admin/messages?isRead=true'));

      expect(all.body).toMatchObject({ total: 2, unreadCount: 1 });
      expect(all.body.items[0].message).toBe('Second');
      expect(unread.body.total).toBe(1);
      expect(read.body.total).toBe(1);
      expect(unread.body.unreadCount).toBe(1);
    });

    it('marks a message read and deletes it; 404 when unknown', async () => {
      await send(valid);
      const { id } = await prisma.contactMessage.findFirstOrThrow();

      const read = await asAdmin(
        http().patch(`/api/admin/messages/${id}/read`),
      );
      const del = await asAdmin(http().delete(`/api/admin/messages/${id}`));
      const missing = await asAdmin(
        http().patch(`/api/admin/messages/${MISSING}/read`),
      );

      expect(read.body.isRead).toBe(true);
      expect(del.body).toEqual({ deleted: true });
      expect(missing.status).toBe(404);
      expect(await prisma.contactMessage.count()).toBe(0);
    });
  });

  describe('settings', () => {
    const body = {
      shopName: 'New Name',
      bankCardNumber: '6037990000000000',
      bankCardHolder: 'Holder',
      shopPhone: '02100000000',
      shopAddress: 'Isfahan',
      businessHours: '10-18',
      postPrice: '65000',
      postEtaDays: 4,
      courierPrice: '120000.50',
      courierEtaDays: 1,
    };

    it('404s the public read when no settings row exists', async () => {
      expect((await http().get('/api/settings')).status).toBe(404);
    });

    it('is public to read, with prices as strings and rates keyed by method', async () => {
      await seedSettings(prisma);

      const res = await http().get('/api/settings');

      expect(res.status).toBe(200);
      expect(res.body.shopName).toBe('Test Shop');
      expect(res.body.shippingRates.POST).toEqual({
        price: '50000',
        etaDays: 5,
      });
      expect(res.body.shippingRates.COURIER.price).toBe('90000');
    });

    it('admin-only to update: 401 anonymous, 403 customer', async () => {
      await seedSettings(prisma);

      expect(
        (await http().patch('/api/admin/settings').send(body)).status,
      ).toBe(401);
      expect(
        (
          await http()
            .patch('/api/admin/settings')
            .set('Authorization', customer)
            .send(body)
        ).status,
      ).toBe(403);
    });

    it('updates the whole row, creating it if missing, and the change is public', async () => {
      const res = await asAdmin(http().patch('/api/admin/settings')).send(body);

      expect(res.status).toBe(200);
      expect(res.body.shippingRates.POST.price).toBe('65000');
      expect(res.body.shippingRates.COURIER.price).toBe('120000.5');
      expect(await prisma.shopSetting.count()).toBe(1);
      expect((await http().get('/api/settings')).body.shopName).toBe(
        'New Name',
      );
    });

    it('rejects partial, negative and over-precise values', async () => {
      await seedSettings(prisma);
      const patch = (extra: object) =>
        asAdmin(http().patch('/api/admin/settings')).send({
          ...body,
          ...extra,
        });

      expect(
        (await asAdmin(http().patch('/api/admin/settings')).send({})).status,
      ).toBe(400);
      expect((await patch({ shopName: '' })).status).toBe(400);
      expect((await patch({ postPrice: '-1' })).status).toBe(400);
      expect((await patch({ postPrice: '10.123' })).status).toBe(400);
      expect((await patch({ postPrice: 'abc' })).status).toBe(400);
      expect((await patch({ courierEtaDays: -1 })).status).toBe(400);
      expect((await patch({ shopName: 'x'.repeat(121) })).status).toBe(400);
    });

    it('a rate change applies to new orders only', async () => {
      await seedSettings(prisma);
      const made = await makeVariant(prisma, { price: 1000 });
      const address = await makeAddress(prisma, customerId);
      const cart = await prisma.cart.create({ data: { userId: customerId } });
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: made.product.id,
          variantId: made.variant.id,
          quantity: 1,
        },
      });
      const order = await http()
        .post('/api/orders')
        .set('Authorization', customer)
        .send({
          shippingMethod: 'POST',
          shippingAddressId: address.id,
          paymentMethod: 'CARD_TO_CARD',
        });

      await asAdmin(http().patch('/api/admin/settings')).send(body);

      const after = await http()
        .get(`/api/orders/${order.body.id}`)
        .set('Authorization', customer);
      expect(after.body.shippingAmount).toBe('50000');
    });
  });

  describe('customers', () => {
    it('lists customers with order count and spend, excluding cancelled orders', async () => {
      await seedSettings(prisma);
      const made = await makeVariant(prisma, { price: 100000, stock: 50 });
      const address = await makeAddress(prisma, customerId);
      const placeOne = async () => {
        const cart = await prisma.cart.upsert({
          where: { userId: customerId },
          create: { userId: customerId },
          update: {},
        });
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: made.product.id,
            variantId: made.variant.id,
            quantity: 1,
          },
        });
        const res = await http()
          .post('/api/orders')
          .set('Authorization', customer)
          .send({
            shippingMethod: 'POST',
            shippingAddressId: address.id,
            paymentMethod: 'CARD_TO_CARD',
          });
        return res.body.id as string;
      };
      await placeOne();
      const cancelled = await placeOne();
      await http()
        .patch(`/api/orders/${cancelled}/cancel`)
        .set('Authorization', customer);

      const res = await asAdmin(
        http().get('/api/admin/customers?role=CUSTOMER'),
      );

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.items[0]).toMatchObject({
        id: customerId,
        orderCount: 1,
        totalSpent: '150000',
        role: 'CUSTOMER',
      });
      expect(res.body.items[0]).not.toHaveProperty('password');
    });

    it('reports zero for a customer without orders', async () => {
      const res = await asAdmin(
        http().get('/api/admin/customers?role=customer'),
      );

      expect(res.body.items[0]).toMatchObject({
        orderCount: 0,
        totalSpent: '0',
      });
    });

    it('searches by name and phone, and paginates', async () => {
      await createSession(app, prisma, Role.CUSTOMER, '09125556666');

      const byPhone = await asAdmin(
        http().get('/api/admin/customers?search=09125556666'),
      );
      const byName = await asAdmin(
        http().get('/api/admin/customers?search=CUSTOMER'),
      );
      const paged = await asAdmin(
        http().get('/api/admin/customers?pageSize=1'),
      );

      expect(byPhone.body.total).toBe(1);
      expect(byName.body.total).toBe(2);
      expect(paged.body).toMatchObject({ total: 3, totalPages: 3 });
    });

    it('rejects an unknown role and an oversized page', async () => {
      expect(
        (await asAdmin(http().get('/api/admin/customers?role=OWNER'))).status,
      ).toBe(400);
      expect(
        (await asAdmin(http().get('/api/admin/customers?pageSize=51'))).status,
      ).toBe(400);
    });
  });

  describe('dashboard', () => {
    const order = (extra: object) =>
      prisma.order.create({
        data: {
          userId: customerId,
          totalAmount: 100000,
          shippingMethod: 'POST',
          shippingAddressId: MISSING,
          shippingLabel: 'Home',
          shippingProvince: 'Tehran',
          shippingCity: 'Tehran',
          shippingFullAddress: 'x',
          shippingPhone: '09121111111',
          ...extra,
        },
      });

    it('is admin-only', async () => {
      expect((await http().get('/api/admin/dashboard/stats')).status).toBe(401);
      expect(
        (
          await http()
            .get('/api/admin/dashboard/stats')
            .set('Authorization', customer)
        ).status,
      ).toBe(403);
    });

    it('returns zeroed, complete stats on an empty shop', async () => {
      const res = await asAdmin(http().get('/api/admin/dashboard/stats'));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        totalOrders: 0,
        totalCustomers: 1,
        totalRevenue: '0',
        rangeRevenue: '0',
        unreadMessages: 0,
      });
      expect(res.body.ordersByStatus).toHaveLength(6);
      expect(res.body.paymentsByStatus).toHaveLength(4);
      expect(res.body.trend).toHaveLength(30);
    });

    it('counts revenue from PAID orders only and groups by status', async () => {
      await order({ paymentStatus: 'PAID', status: 'CONFIRMED' });
      await order({
        paymentStatus: 'PAID',
        status: 'DELIVERED',
        totalAmount: 50000,
      });
      await order({ paymentStatus: 'PENDING', status: 'PENDING' });

      const res = await asAdmin(http().get('/api/admin/dashboard/stats'));

      expect(res.body.totalOrders).toBe(3);
      expect(res.body.totalRevenue).toBe('150000');
      expect(res.body.rangeRevenue).toBe('150000');
      expect(res.body.ordersInRange).toBe(3);
      const status = Object.fromEntries(
        res.body.ordersByStatus.map((s: { status: string; count: number }) => [
          s.status,
          s.count,
        ]),
      );
      expect(status).toMatchObject({
        CONFIRMED: 1,
        DELIVERED: 1,
        PENDING: 1,
        CANCELLED: 0,
      });
      const payment = Object.fromEntries(
        res.body.paymentsByStatus.map(
          (p: { paymentStatus: string; count: number }) => [
            p.paymentStatus,
            p.count,
          ],
        ),
      );
      expect(payment).toMatchObject({ PAID: 2, PENDING: 1, FAILED: 0 });
    });

    it('builds a dense daily trend whose last bucket holds today’s orders', async () => {
      await order({ paymentStatus: 'PAID' });

      const res = await asAdmin(
        http().get('/api/admin/dashboard/stats?days=7'),
      );

      expect(res.body.trend).toHaveLength(7);
      const last = res.body.trend[6];
      expect(last).toMatchObject({ orders: 1, revenue: '100000' });
      expect(
        res.body.trend
          .slice(0, 6)
          .every((d: { orders: number }) => d.orders === 0),
      ).toBe(true);
    });

    it('keeps all-time revenue but drops old orders from the range', async () => {
      const old = await order({ paymentStatus: 'PAID' });
      await prisma.order.update({
        where: { id: old.id },
        data: { createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) },
      });

      const res = await asAdmin(
        http().get('/api/admin/dashboard/stats?days=30'),
      );

      expect(res.body.totalRevenue).toBe('100000');
      expect(res.body.rangeRevenue).toBe('0');
      expect(res.body.ordersInRange).toBe(0);
    });

    it('counts unread messages, products, categories and portfolio items', async () => {
      await makeVariant(prisma);
      await prisma.contactMessage.create({
        data: { name: 'a', phone: '09120000001', message: 'm' },
      });
      await prisma.portfolio.create({
        data: { title: 'p', slug: 'p', images: [] },
      });

      const res = await asAdmin(http().get('/api/admin/dashboard/stats'));

      expect(res.body).toMatchObject({
        totalProducts: 1,
        totalCategories: 1,
        totalPortfolioItems: 1,
        unreadMessages: 1,
      });
    });

    it('validates the days window', async () => {
      for (const days of [0, 366, -5, 'abc']) {
        const res = await asAdmin(
          http().get(`/api/admin/dashboard/stats?days=${days}`),
        );
        expect(res.status).toBe(400);
      }
      expect(
        (await asAdmin(http().get('/api/admin/dashboard/stats?days=365')))
          .status,
      ).toBe(200);
    });
  });
});
