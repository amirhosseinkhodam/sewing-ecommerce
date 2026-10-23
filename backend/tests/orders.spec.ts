import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { Role } from '../src/generated/prisma/client';
import { SmsProvider } from '../src/sms/providers/sms-provider';
import { createSession } from './helpers/auth';
import { createTestApp, resetDatabase } from './helpers/app';
import {
  COURIER_PRICE,
  POST_PRICE,
  makeAddress,
  makeVariant,
  seedSettings,
} from './helpers/fixtures';

describe('orders', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sendSms: jest.SpyInstance;
  let admin: string;
  let customer: string;
  let customerId: string;
  let other: string;
  let addressId: string;

  const http = () => request(app.getHttpServer());

  const addToCart = async (
    userId: string,
    productId: string,
    variantId: string,
    quantity: number,
  ) => {
    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId, quantity },
    });
  };

  const place = (token: string, extra: object = {}) =>
    http()
      .post('/api/orders')
      .set('Authorization', token)
      .send({
        shippingMethod: 'POST',
        shippingAddressId: addressId,
        paymentMethod: 'CARD_TO_CARD',
        ...extra,
      });

  /** Puts `quantity` of a fresh variant in the cart and places the order. */
  const placeOrder = async (
    opts: { stock?: number; quantity?: number; price?: number } = {},
    extra: object = {},
  ) => {
    const { stock = 10, quantity = 2, price = 100000 } = opts;
    const made = await makeVariant(prisma, { stock, price });
    await addToCart(customerId, made.product.id, made.variant.id, quantity);
    const res = await place(customer, extra);
    return { ...made, res };
  };

  const stockOf = async (variantId: string) =>
    (
      await prisma.productVariant.findUniqueOrThrow({
        where: { id: variantId },
      })
    ).stock;

  const setStatus = (id: string, status: string, extra: object = {}) =>
    http()
      .patch(`/api/admin/orders/${id}/status`)
      .set('Authorization', admin)
      .send({ status, ...extra });

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    sendSms = jest.spyOn(app.get(SmsProvider), 'send');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    sendSms.mockClear();
    await seedSettings(prisma);
    admin = (await createSession(app, prisma, Role.ADMIN)).bearer;
    const session = await createSession(app, prisma, Role.CUSTOMER);
    customer = session.bearer;
    customerId = session.user.id;
    other = (await createSession(app, prisma, Role.CUSTOMER, '09122222222'))
      .bearer;
    addressId = (await makeAddress(prisma, customerId)).id;
  });

  describe('placement', () => {
    it('requires authentication', async () => {
      expect((await http().post('/api/orders').send({})).status).toBe(401);
      expect((await http().get('/api/orders')).status).toBe(401);
    });

    it('snapshots price, items and address; total = subtotal + shipping', async () => {
      const { res, product, variant } = await placeOrder({
        quantity: 3,
        price: 100000,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'CARD_TO_CARD',
        shippingMethod: 'POST',
        shippingAmount: String(POST_PRICE),
        totalAmount: String(300000 + POST_PRICE),
      });
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toMatchObject({
        productId: product.id,
        productName: product.name,
        size: 'M',
        quantity: 3,
        unitPrice: '100000',
        totalPrice: '300000',
      });
      expect(res.body.shippingAddress).toMatchObject({
        label: 'Home',
        city: 'Tehran',
        fullAddress: 'Valiasr St. 1',
      });
      expect(variant.id).toBeDefined();
    });

    it('uses the variant price override', async () => {
      const made = await makeVariant(prisma, {
        price: 100000,
        variantPrice: 70000,
      });
      await addToCart(customerId, made.product.id, made.variant.id, 2);

      const res = await place(customer);

      expect(res.body.items[0].unitPrice).toBe('70000');
      expect(res.body.totalAmount).toBe(String(140000 + POST_PRICE));
    });

    it('sums several lines', async () => {
      const a = await makeVariant(prisma, { price: 10000 });
      const b = await makeVariant(prisma, { price: 25000 });
      await addToCart(customerId, a.product.id, a.variant.id, 2);
      await addToCart(customerId, b.product.id, b.variant.id, 1);

      const res = await place(customer);

      expect(res.body.items).toHaveLength(2);
      expect(res.body.totalAmount).toBe(String(45000 + POST_PRICE));
    });

    it('reads the courier rate from settings, ignoring any client amount', async () => {
      const { res } = await placeOrder(
        { quantity: 1, price: 100000 },
        { shippingMethod: 'COURIER', shippingAmount: 1, totalAmount: 1 },
      );

      expect(res.status).toBe(201);
      expect(res.body.shippingAmount).toBe(String(COURIER_PRICE));
      expect(res.body.totalAmount).toBe(String(100000 + COURIER_PRICE));
    });

    it('uses the current settings rate at the time of ordering', async () => {
      await prisma.shopSetting.update({
        where: { id: 'default' },
        data: { postPrice: 12345 },
      });

      const { res } = await placeOrder({ quantity: 1, price: 1000 });

      expect(res.body.shippingAmount).toBe('12345');
    });

    it('decrements stock and empties the cart', async () => {
      const { res, variant } = await placeOrder({ stock: 10, quantity: 4 });

      expect(res.status).toBe(201);
      expect(await stockOf(variant.id)).toBe(6);
      const cart = await http().get('/api/cart').set('Authorization', customer);
      expect(cart.body.items).toEqual([]);
    });

    it('later price, product and address edits never rewrite the order', async () => {
      const { res, product, variant } = await placeOrder({ price: 100000 });
      await prisma.product.update({
        where: { id: product.id },
        data: { price: 999, name: 'Renamed' },
      });
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { price: 5 },
      });
      await prisma.address.update({
        where: { id: addressId },
        data: { city: 'Shiraz' },
      });

      const after = await http()
        .get(`/api/orders/${res.body.id}`)
        .set('Authorization', customer);

      expect(after.body.items[0].unitPrice).toBe('100000');
      expect(after.body.items[0].productName).toBe(product.name);
      expect(after.body.shippingAddress.city).toBe('Tehran');
    });

    it('rejects an empty cart', async () => {
      const res = await place(customer);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Cart is empty');
    });

    it('rejects when stock fell below the cart quantity, changing nothing', async () => {
      const made = await makeVariant(prisma, { stock: 5 });
      await addToCart(customerId, made.product.id, made.variant.id, 4);
      await prisma.productVariant.update({
        where: { id: made.variant.id },
        data: { stock: 2 },
      });

      const res = await place(customer);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Insufficient stock');
      expect(await prisma.order.count()).toBe(0);
      expect(await stockOf(made.variant.id)).toBe(2);
      expect(await prisma.cartItem.count()).toBe(1);
    });

    it("rejects another user's address and an unknown one with 404", async () => {
      const foreign = await makeAddress(
        prisma,
        (
          await prisma.user.findFirstOrThrow({
            where: { phone: '09122222222' },
          })
        ).id,
      );
      const made = await makeVariant(prisma);
      await addToCart(customerId, made.product.id, made.variant.id, 1);

      const res = await place(customer, { shippingAddressId: foreign.id });
      const unknown = await place(customer, {
        shippingAddressId: '00000000-0000-4000-8000-000000000000',
      });

      expect(res.status).toBe(404);
      expect(unknown.status).toBe(404);
      expect(await prisma.order.count()).toBe(0);
    });

    it.each([
      ['an unknown shipping method', { shippingMethod: 'DRONE' }],
      ['an unknown payment method', { paymentMethod: 'CASH' }],
      ['a non-UUID address id', { shippingAddressId: 'x' }],
    ])('rejects %s with 400', async (_label, extra) => {
      const res = await place(customer, extra);

      expect(res.status).toBe(400);
    });

    it('stores notes', async () => {
      const { res } = await placeOrder({}, { notes: 'Call first' });

      expect(res.body.notes).toBe('Call first');
    });

    it('creates an ONLINE order when a gateway is configured', async () => {
      const { res } = await placeOrder({}, { paymentMethod: 'ONLINE' });

      expect(res.status).toBe(201);
      expect(res.body.paymentMethod).toBe('ONLINE');
      expect(res.body.paymentStatus).toBe('PENDING');
    });
  });

  describe('reading orders', () => {
    it('lists only my orders, newest first, with pagination', async () => {
      const first = await placeOrder();
      const second = await placeOrder();

      const res = await http()
        .get('/api/orders?pageSize=1')
        .set('Authorization', customer);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ total: 2, page: 1, pageSize: 1 });
      expect(res.body.totalPages).toBe(2);
      expect(res.body.items[0].id).toBe(second.res.body.id);
      expect(first.res.body.id).not.toBe(second.res.body.id);
    });

    it("never shows another user's orders in the list", async () => {
      await placeOrder();

      const res = await http().get('/api/orders').set('Authorization', other);

      expect(res.body.total).toBe(0);
    });

    it('filters by status', async () => {
      const a = await placeOrder();
      await placeOrder();
      await setStatus(a.res.body.id, 'CONFIRMED');

      const res = await http()
        .get('/api/orders?status=CONFIRMED')
        .set('Authorization', customer);

      expect(res.body.total).toBe(1);
      expect(res.body.items[0].id).toBe(a.res.body.id);
    });

    it('rejects an unknown status filter and an oversized page', async () => {
      const bad = await http()
        .get('/api/orders?status=NOPE')
        .set('Authorization', customer);
      const big = await http()
        .get('/api/orders?pageSize=51')
        .set('Authorization', customer);

      expect(bad.status).toBe(400);
      expect(big.status).toBe(400);
    });

    it("404s (not 403) for someone else's order, same as a missing one", async () => {
      const { res } = await placeOrder();

      const foreign = await http()
        .get(`/api/orders/${res.body.id}`)
        .set('Authorization', other);
      const missing = await http()
        .get('/api/orders/00000000-0000-4000-8000-000000000000')
        .set('Authorization', other);

      expect(foreign.status).toBe(404);
      expect(missing.status).toBe(404);
      expect(foreign.body).toEqual(missing.body);
    });
  });

  describe('admin access', () => {
    it('is admin-only: 401 anonymous, 403 customer', async () => {
      const { res } = await placeOrder();
      const urls = [
        ['get', '/api/admin/orders'],
        ['get', `/api/admin/orders/${res.body.id}`],
        ['patch', `/api/admin/orders/${res.body.id}/status`],
        ['patch', `/api/admin/orders/${res.body.id}/payment`],
      ] as const;

      for (const [method, url] of urls) {
        const anonymous = await http()[method](url);
        const asCustomer = await http()
          [method](url)
          .set('Authorization', customer);
        expect(anonymous.status).toBe(401);
        expect(asCustomer.status).toBe(403);
      }
    });

    it('lists all orders with the customer attached', async () => {
      await placeOrder();

      const res = await http()
        .get('/api/admin/orders')
        .set('Authorization', admin);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.items[0].customer).toMatchObject({
        id: customerId,
        phone: '09121111111',
      });
    });

    it('searches by customer phone and by order id, case-insensitively', async () => {
      const { res } = await placeOrder();

      const byPhone = await http()
        .get('/api/admin/orders?search=09121111111')
        .set('Authorization', admin);
      const byId = await http()
        .get(
          `/api/admin/orders?search=${res.body.id.slice(0, 8).toUpperCase()}`,
        )
        .set('Authorization', admin);
      const none = await http()
        .get('/api/admin/orders?search=09999999999')
        .set('Authorization', admin);

      expect(byPhone.body.total).toBe(1);
      expect(byId.body.total).toBe(1);
      expect(none.body.total).toBe(0);
    });

    it('gets one order, 404 when unknown', async () => {
      const { res } = await placeOrder();

      const ok = await http()
        .get(`/api/admin/orders/${res.body.id}`)
        .set('Authorization', admin);
      const missing = await http()
        .get('/api/admin/orders/00000000-0000-4000-8000-000000000000')
        .set('Authorization', admin);

      expect(ok.status).toBe(200);
      expect(missing.status).toBe(404);
    });
  });

  describe('status lifecycle', () => {
    const allowed: [string, string][] = [
      ['PENDING', 'CONFIRMED'],
      ['PENDING', 'CANCELLED'],
      ['CONFIRMED', 'PROCESSING'],
      ['CONFIRMED', 'CANCELLED'],
      ['PROCESSING', 'SHIPPED'],
      ['PROCESSING', 'CANCELLED'],
      ['SHIPPED', 'DELIVERED'],
    ];
    const all = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];
    const forbidden = all.flatMap((from) =>
      all
        .filter(
          (to) =>
            to !== from && !allowed.some(([f, t]) => f === from && t === to),
        )
        .map((to) => [from, to] as [string, string]),
    );

    it.each(allowed)('allows %s → %s', async (from, to) => {
      const { res } = await placeOrder();
      await prisma.order.update({
        where: { id: res.body.id },
        data: { status: from as never },
      });

      const out = await setStatus(res.body.id, to);

      expect(out.status).toBe(200);
      expect(out.body.status).toBe(to);
    });

    it.each(forbidden)('refuses %s → %s with 400', async (from, to) => {
      const { res } = await placeOrder();
      await prisma.order.update({
        where: { id: res.body.id },
        data: { status: from as never },
      });

      const out = await setStatus(res.body.id, to);

      expect(out.status).toBe(400);
      const row = await prisma.order.findUniqueOrThrow({
        where: { id: res.body.id },
      });
      expect(row.status).toBe(from);
    });

    it('treats a same-status update as a no-op without an SMS', async () => {
      const { res } = await placeOrder();
      sendSms.mockClear();

      const out = await setStatus(res.body.id, 'PENDING');

      expect(out.status).toBe(200);
      expect(sendSms).not.toHaveBeenCalled();
    });

    it('rejects an unknown status and 404s an unknown order', async () => {
      const { res } = await placeOrder();

      expect((await setStatus(res.body.id, 'LOST')).status).toBe(400);
      expect(
        (await setStatus('00000000-0000-4000-8000-000000000000', 'CONFIRMED'))
          .status,
      ).toBe(404);
    });

    it('stores a tracking code and sends it in the SHIPPED SMS', async () => {
      const { res } = await placeOrder();
      await setStatus(res.body.id, 'CONFIRMED');
      await setStatus(res.body.id, 'PROCESSING');
      sendSms.mockClear();

      const out = await setStatus(res.body.id, 'SHIPPED', {
        trackingCode: 'TRK-123',
      });

      expect(out.body.trackingCode).toBe('TRK-123');
      expect(sendSms).toHaveBeenCalledTimes(1);
      expect(sendSms.mock.calls[0][0]).toBe('09121111111');
      expect(sendSms.mock.calls[0][1]).toContain('TRK-123');
    });

    it('rejects a tracking code longer than 100 characters', async () => {
      const { res } = await placeOrder();

      const out = await setStatus(res.body.id, 'CONFIRMED', {
        trackingCode: 'x'.repeat(101),
      });

      expect(out.status).toBe(400);
    });

    it('sends one SMS per status change, to the order owner, with the short id', async () => {
      const { res } = await placeOrder();
      const shortId = res.body.id.slice(0, 8);
      const steps: [string, string][] = [
        ['CONFIRMED', 'تأیید'],
        ['PROCESSING', 'آماده‌سازی'],
        ['SHIPPED', 'ارسال'],
        ['DELIVERED', 'تحویل'],
      ];

      for (const [status, word] of steps) {
        sendSms.mockClear();
        await setStatus(res.body.id, status);
        expect(sendSms).toHaveBeenCalledTimes(1);
        const [phone, text] = sendSms.mock.calls[0];
        expect(phone).toBe('09121111111');
        expect(text).toContain(word);
        expect(text).toContain(shortId);
      }
    });

    it('does not break the status change when the SMS provider throws', async () => {
      const { res } = await placeOrder();
      sendSms.mockRejectedValueOnce(new Error('provider down'));

      const out = await setStatus(res.body.id, 'CONFIRMED');

      expect(out.status).toBe(200);
      expect(out.body.status).toBe('CONFIRMED');
    });
  });

  describe('cancelling and stock', () => {
    it('admin cancel restores stock and notifies the customer', async () => {
      const { res, variant } = await placeOrder({ stock: 10, quantity: 4 });
      expect(await stockOf(variant.id)).toBe(6);
      sendSms.mockClear();

      const out = await setStatus(res.body.id, 'CANCELLED');

      expect(out.status).toBe(200);
      expect(await stockOf(variant.id)).toBe(10);
      expect(sendSms).toHaveBeenCalledTimes(1);
      expect(sendSms.mock.calls[0][1]).toContain('لغو');
    });

    it('customer can cancel while PENDING and CONFIRMED', async () => {
      for (const status of ['PENDING', 'CONFIRMED']) {
        const { res, variant } = await placeOrder({ stock: 5, quantity: 2 });
        await prisma.order.update({
          where: { id: res.body.id },
          data: { status: status as never },
        });

        const out = await http()
          .patch(`/api/orders/${res.body.id}/cancel`)
          .set('Authorization', customer);

        expect(out.status).toBe(200);
        expect(out.body.status).toBe('CANCELLED');
        expect(await stockOf(variant.id)).toBe(5);
      }
    });

    it.each(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])(
      'customer cannot cancel a %s order (403) and stock is untouched',
      async (status) => {
        const { res, variant } = await placeOrder({ stock: 5, quantity: 2 });
        await prisma.order.update({
          where: { id: res.body.id },
          data: { status: status as never },
        });

        const out = await http()
          .patch(`/api/orders/${res.body.id}/cancel`)
          .set('Authorization', customer);

        expect(out.status).toBe(403);
        expect(await stockOf(variant.id)).toBe(3);
      },
    );

    it("customer cannot cancel someone else's order", async () => {
      const { res, variant } = await placeOrder({ stock: 5, quantity: 2 });

      const out = await http()
        .patch(`/api/orders/${res.body.id}/cancel`)
        .set('Authorization', other);

      expect(out.status).toBe(404);
      expect(await stockOf(variant.id)).toBe(3);
    });

    it('cancelling twice does not restore stock twice', async () => {
      const { res, variant } = await placeOrder({ stock: 10, quantity: 4 });

      await http()
        .patch(`/api/orders/${res.body.id}/cancel`)
        .set('Authorization', customer);
      const again = await http()
        .patch(`/api/orders/${res.body.id}/cancel`)
        .set('Authorization', customer);

      expect(again.status).toBe(403);
      expect(await stockOf(variant.id)).toBe(10);
    });

    it('restores stock to the right variant when a product has several sizes', async () => {
      const made = await makeVariant(prisma, { stock: 5, size: 'M' });
      const large = await prisma.productVariant.create({
        data: { productId: made.product.id, size: 'L', stock: 5 },
      });
      await addToCart(customerId, made.product.id, large.id, 2);
      const res = await place(customer);

      await http()
        .patch(`/api/orders/${res.body.id}/cancel`)
        .set('Authorization', customer);

      expect(await stockOf(large.id)).toBe(5);
      expect(await stockOf(made.variant.id)).toBe(5);
    });
  });

  describe('card-to-card receipt and payment', () => {
    it('lets the owner attach a receipt', async () => {
      const { res } = await placeOrder();

      const out = await http()
        .patch(`/api/orders/${res.body.id}/receipt`)
        .set('Authorization', customer)
        .send({ paymentReceipt: '/uploads/receipt.png' });

      expect(out.status).toBe(200);
      expect(out.body.paymentReceipt).toBe('/uploads/receipt.png');
    });

    it('lets the owner replace the receipt before payment is confirmed', async () => {
      const { res } = await placeOrder();
      const send = (file: string) =>
        http()
          .patch(`/api/orders/${res.body.id}/receipt`)
          .set('Authorization', customer)
          .send({ paymentReceipt: file });

      await send('/uploads/a.png');
      const out = await send('/uploads/b.png');

      expect(out.body.paymentReceipt).toBe('/uploads/b.png');
    });

    it("refuses another user's order, a paid order, a cancelled order and an online order", async () => {
      const card = await placeOrder();
      const paid = await placeOrder();
      await prisma.order.update({
        where: { id: paid.res.body.id },
        data: { paymentStatus: 'PAID' },
      });
      const cancelled = await placeOrder();
      await prisma.order.update({
        where: { id: cancelled.res.body.id },
        data: { status: 'CANCELLED' },
      });
      const online = await placeOrder({}, { paymentMethod: 'ONLINE' });
      const receipt = (token: string, id: string) =>
        http()
          .patch(`/api/orders/${id}/receipt`)
          .set('Authorization', token)
          .send({ paymentReceipt: '/uploads/r.png' });

      expect((await receipt(other, card.res.body.id)).status).toBe(404);
      expect((await receipt(customer, paid.res.body.id)).status).toBe(400);
      expect((await receipt(customer, cancelled.res.body.id)).status).toBe(400);
      expect((await receipt(customer, online.res.body.id)).status).toBe(400);
    });

    it('validates the receipt path', async () => {
      const { res } = await placeOrder();
      const send = (body: object) =>
        http()
          .patch(`/api/orders/${res.body.id}/receipt`)
          .set('Authorization', customer)
          .send(body);

      expect((await send({})).status).toBe(400);
      expect((await send({ paymentReceipt: '' })).status).toBe(400);
      expect((await send({ paymentReceipt: 'x'.repeat(501) })).status).toBe(
        400,
      );
    });

    it('PAID on a PENDING order confirms it and notifies once', async () => {
      const { res } = await placeOrder();
      sendSms.mockClear();

      const out = await http()
        .patch(`/api/admin/orders/${res.body.id}/payment`)
        .set('Authorization', admin)
        .send({ paymentStatus: 'PAID' });

      expect(out.status).toBe(200);
      expect(out.body).toMatchObject({
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      });
      expect(sendSms).toHaveBeenCalledTimes(1);
    });

    it('PAID does not move an order that is already past PENDING', async () => {
      const { res } = await placeOrder();
      await setStatus(res.body.id, 'CONFIRMED');
      await setStatus(res.body.id, 'PROCESSING');
      sendSms.mockClear();

      const out = await http()
        .patch(`/api/admin/orders/${res.body.id}/payment`)
        .set('Authorization', admin)
        .send({ paymentStatus: 'PAID' });

      expect(out.body.status).toBe('PROCESSING');
      expect(sendSms).not.toHaveBeenCalled();
    });

    it('rejecting a payment (FAILED) keeps the order PENDING', async () => {
      const { res } = await placeOrder();

      const out = await http()
        .patch(`/api/admin/orders/${res.body.id}/payment`)
        .set('Authorization', admin)
        .send({ paymentStatus: 'FAILED' });

      expect(out.body).toMatchObject({
        paymentStatus: 'FAILED',
        status: 'PENDING',
      });
    });

    it('rejects an unknown payment status and 404s an unknown order', async () => {
      const { res } = await placeOrder();
      const patch = (id: string, paymentStatus: string) =>
        http()
          .patch(`/api/admin/orders/${id}/payment`)
          .set('Authorization', admin)
          .send({ paymentStatus });

      expect((await patch(res.body.id, 'MAYBE')).status).toBe(400);
      expect(
        (await patch('00000000-0000-4000-8000-000000000000', 'PAID')).status,
      ).toBe(404);
    });
  });
});
