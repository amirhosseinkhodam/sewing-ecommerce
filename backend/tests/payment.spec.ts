import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { Role } from '../src/generated/prisma/client';
import { UnpaidOrderSweeper } from '../src/orders/unpaid-order.sweeper';
import { SmsProvider } from '../src/sms/providers/sms-provider';
import { createSession } from './helpers/auth';
import { createTestApp, resetDatabase } from './helpers/app';
import { makeAddress, makeVariant, seedSettings } from './helpers/fixtures';

const MISSING = '00000000-0000-4000-8000-000000000000';

describe('payment', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sendSms: jest.SpyInstance;
  let customer: string;
  let customerId: string;
  let other: string;
  let addressId: string;

  const http = () => request(app.getHttpServer());

  const placeOrder = async (
    paymentMethod: 'ONLINE' | 'CARD_TO_CARD' = 'ONLINE',
    { stock = 10, quantity = 2 } = {},
  ) => {
    const made = await makeVariant(prisma, { stock, price: 100000 });
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
        quantity,
      },
    });
    const res = await http()
      .post('/api/orders')
      .set('Authorization', customer)
      .send({
        shippingMethod: 'POST',
        shippingAddressId: addressId,
        paymentMethod,
      });
    return { ...made, orderId: res.body.id as string };
  };

  const start = (token: string, orderId: string) =>
    http().post(`/api/payment/${orderId}/start`).set('Authorization', token);

  /** Path of the fake bank page for an attempt, e.g. /api/payment/fake/FAKE-… */
  const startOk = async (orderId: string) => {
    const res = await start(customer, orderId);
    expect(res.status).toBe(201);
    return res.body.redirectUrl as string;
  };

  /** Presses Pay or Fail on the fake bank page; returns the gateway's callback URL. */
  const press = async (bankPage: string, button: 'pay' | 'fail') => {
    const res = await http().get(`${bankPage}/${button}`);
    expect(res.status).toBe(302);
    const url = new URL(res.headers.location);
    return `${url.pathname}${url.search}`;
  };

  const callback = (path: string) => http().get(path);
  const orderRow = (id: string) =>
    prisma.order.findUniqueOrThrow({ where: { id } });
  const stockOf = async (variantId: string) =>
    (
      await prisma.productVariant.findUniqueOrThrow({
        where: { id: variantId },
      })
    ).stock;

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
    const session = await createSession(app, prisma, Role.CUSTOMER);
    customer = session.bearer;
    customerId = session.user.id;
    other = (await createSession(app, prisma, Role.CUSTOMER, '09122222222'))
      .bearer;
    addressId = (await makeAddress(prisma, customerId)).id;
  });

  it('GET /payment/methods is public and offers ONLINE and CARD_TO_CARD', async () => {
    const res = await http().get('/api/payment/methods');

    expect(res.status).toBe(200);
    expect(res.body.methods).toEqual(['ONLINE', 'CARD_TO_CARD']);
  });

  describe('start', () => {
    it('requires authentication', async () => {
      expect((await http().post(`/api/payment/${MISSING}/start`)).status).toBe(
        401,
      );
    });

    it('stores an authority on the order and returns the bank redirect', async () => {
      const { orderId } = await placeOrder();

      const res = await start(customer, orderId);

      expect(res.status).toBe(201);
      expect(res.body.redirectUrl).toMatch(/^\/api\/payment\/fake\/FAKE-/);
      const row = await orderRow(orderId);
      expect(row.paymentAuthority).toMatch(/^FAKE-/);
      expect(row.paymentStatus).toBe('PENDING');
    });

    it("404s for another user's order and an unknown order", async () => {
      const { orderId } = await placeOrder();

      expect((await start(other, orderId)).status).toBe(404);
      expect((await start(customer, MISSING)).status).toBe(404);
    });

    it('refuses card-to-card, already-paid and cancelled orders', async () => {
      const card = await placeOrder('CARD_TO_CARD');
      const paid = await placeOrder();
      await prisma.order.update({
        where: { id: paid.orderId },
        data: { paymentStatus: 'PAID' },
      });
      const cancelled = await placeOrder();
      await prisma.order.update({
        where: { id: cancelled.orderId },
        data: { status: 'CANCELLED' },
      });

      expect((await start(customer, card.orderId)).status).toBe(400);
      expect((await start(customer, paid.orderId)).status).toBe(400);
      expect((await start(customer, cancelled.orderId)).status).toBe(400);
    });

    it('serves the fake bank page with the amount, and 404s for an unknown attempt', async () => {
      const { orderId } = await placeOrder();
      const bankPage = await startOk(orderId);

      const page = await http().get(bankPage);
      const unknown = await http().get('/api/payment/fake/FAKE-nope');

      expect(page.status).toBe(200);
      expect(page.text).toContain('250,000');
      expect(unknown.status).toBe(404);
    });
  });

  describe('callback', () => {
    it('marks the order PAID and CONFIRMED, stores the ref id and sends an SMS', async () => {
      const { orderId } = await placeOrder();
      const cb = await press(await startOk(orderId), 'pay');
      sendSms.mockClear();

      const res = await callback(cb);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`/orders/${orderId}?payment=SUCCESS`);
      const row = await orderRow(orderId);
      expect(row).toMatchObject({ paymentStatus: 'PAID', status: 'CONFIRMED' });
      expect(row.paymentRefId).toBeTruthy();
      expect(sendSms).toHaveBeenCalledTimes(1);
    });

    it('marks the order FAILED when the customer cancels at the bank, keeping stock reserved', async () => {
      const { orderId, variant } = await placeOrder('ONLINE', {
        stock: 10,
        quantity: 2,
      });
      const cb = await press(await startOk(orderId), 'fail');

      const res = await callback(cb);

      expect(res.headers.location).toBe(`/orders/${orderId}?payment=FAILED`);
      const row = await orderRow(orderId);
      expect(row).toMatchObject({ paymentStatus: 'FAILED', status: 'PENDING' });
      expect(await stockOf(variant.id)).toBe(8);
    });

    it('is safe to call twice: no second verify, no second SMS', async () => {
      const { orderId } = await placeOrder();
      const cb = await press(await startOk(orderId), 'pay');
      await callback(cb);
      sendSms.mockClear();
      const refId = (await orderRow(orderId)).paymentRefId;

      const again = await callback(cb);

      expect(again.headers.location).toBe(`/orders/${orderId}?payment=SUCCESS`);
      expect(sendSms).not.toHaveBeenCalled();
      expect((await orderRow(orderId)).paymentRefId).toBe(refId);
    });

    it('survives two racing callbacks and records the payment once', async () => {
      const { orderId } = await placeOrder();
      const cb = await press(await startOk(orderId), 'pay');
      sendSms.mockClear();

      const results = await Promise.all([callback(cb), callback(cb)]);

      for (const res of results) expect(res.status).toBe(302);
      expect((await orderRow(orderId)).paymentStatus).toBe('PAID');
      expect(sendSms.mock.calls.length).toBeLessThanOrEqual(1);
    });

    it('does not trust Status=OK on its own: paying was never pressed', async () => {
      const { orderId } = await placeOrder();
      const bankPage = await startOk(orderId);
      const authority = bankPage.split('/').pop();

      const res = await callback(
        `/api/payment/callback?Authority=${authority}&Status=OK`,
      );

      expect(res.headers.location).toBe(`/orders/${orderId}?payment=FAILED`);
      expect((await orderRow(orderId)).paymentStatus).toBe('FAILED');
    });

    it('never verifies an order cancelled while the customer was at the bank', async () => {
      const { orderId, variant } = await placeOrder();
      const cb = await press(await startOk(orderId), 'pay');
      await http()
        .patch(`/api/orders/${orderId}/cancel`)
        .set('Authorization', customer);

      const res = await callback(cb);

      expect(res.headers.location).toBe(`/orders/${orderId}?payment=FAILED`);
      const row = await orderRow(orderId);
      expect(row.status).toBe('CANCELLED');
      expect(row.paymentStatus).not.toBe('PAID');
      expect(await stockOf(variant.id)).toBe(10);
    });

    it('can be retried after a failure, and the old attempt is dead', async () => {
      const { orderId } = await placeOrder();
      const firstPage = await startOk(orderId);
      const firstFail = await press(firstPage, 'fail');
      await callback(firstFail);
      expect((await orderRow(orderId)).paymentStatus).toBe('FAILED');

      const secondPage = await startOk(orderId);
      expect(secondPage).not.toBe(firstPage);
      expect((await orderRow(orderId)).paymentStatus).toBe('PENDING');
      const late = await callback(firstFail);
      expect(late.headers.location).toBe('/orders');
      const ok = await callback(await press(secondPage, 'pay'));

      expect(ok.headers.location).toBe(`/orders/${orderId}?payment=SUCCESS`);
      expect((await orderRow(orderId)).paymentStatus).toBe('PAID');
    });

    it('sends an unknown authority to /orders without touching anything', async () => {
      const { orderId } = await placeOrder();

      const res = await callback(
        '/api/payment/callback?Authority=FAKE-unknown&Status=OK',
      );

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/orders');
      expect((await orderRow(orderId)).paymentStatus).toBe('PENDING');
    });

    it('rejects a malformed callback query with 400', async () => {
      expect((await callback('/api/payment/callback')).status).toBe(400);
      expect(
        (await callback('/api/payment/callback?Authority=x&Status=MAYBE'))
          .status,
      ).toBe(400);
      expect(
        (
          await callback(
            `/api/payment/callback?Authority=${'x'.repeat(101)}&Status=OK`,
          )
        ).status,
      ).toBe(400);
    });

    it('needs no bearer token (the gateway redirects the browser)', async () => {
      const { orderId } = await placeOrder();
      const cb = await press(await startOk(orderId), 'pay');

      const res = await callback(cb);

      expect(res.status).toBe(302);
    });
  });

  describe('unpaid online order sweeper', () => {
    const HOUR = 60 * 60 * 1000;
    let sweeper: UnpaidOrderSweeper;

    const age = (id: string, hours: number) =>
      prisma.order.update({
        where: { id },
        data: { createdAt: new Date(Date.now() - hours * HOUR) },
      });

    beforeAll(() => {
      sweeper = app.get(UnpaidOrderSweeper);
    });

    it('cancels an online order unpaid for over 24h, restores stock and sends an SMS', async () => {
      const { orderId, variant } = await placeOrder('ONLINE', {
        stock: 10,
        quantity: 3,
      });
      await startOk(orderId);
      await age(orderId, 25);
      sendSms.mockClear();

      const cancelled = await sweeper.sweep();

      expect(cancelled).toBe(1);
      const row = await orderRow(orderId);
      expect(row).toMatchObject({
        status: 'CANCELLED',
        paymentStatus: 'FAILED',
        paymentAuthority: null,
      });
      expect(await stockOf(variant.id)).toBe(10);
      expect(sendSms).toHaveBeenCalledTimes(1);
      expect(sendSms.mock.calls[0][1]).toContain('لغو');
    });

    it('leaves an online order younger than 24h alone', async () => {
      const { orderId, variant } = await placeOrder();
      await age(orderId, 23);

      expect(await sweeper.sweep()).toBe(0);
      expect((await orderRow(orderId)).status).toBe('PENDING');
      expect(await stockOf(variant.id)).toBe(8);
    });

    it('uses the supplied clock', async () => {
      const { orderId } = await placeOrder();

      expect(await sweeper.sweep()).toBe(0);
      const future = new Date(Date.now() + 25 * HOUR);
      expect(await sweeper.sweep(future)).toBe(1);
      expect((await orderRow(orderId)).status).toBe('CANCELLED');
    });

    it('never touches card-to-card, paid or already-progressed orders', async () => {
      const card = await placeOrder('CARD_TO_CARD');
      const paid = await placeOrder();
      const confirmed = await placeOrder();
      await prisma.order.update({
        where: { id: paid.orderId },
        data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
      });
      await prisma.order.update({
        where: { id: confirmed.orderId },
        data: { status: 'CONFIRMED' },
      });
      for (const o of [card, paid, confirmed]) await age(o.orderId, 48);

      expect(await sweeper.sweep()).toBe(0);
      expect((await orderRow(card.orderId)).status).toBe('PENDING');
      expect((await orderRow(paid.orderId)).status).toBe('CONFIRMED');
      expect((await orderRow(confirmed.orderId)).status).toBe('CONFIRMED');
    });

    it('is idempotent: a second sweep releases nothing and restores no extra stock', async () => {
      const { orderId, variant } = await placeOrder('ONLINE', {
        stock: 10,
        quantity: 3,
      });
      await age(orderId, 30);

      expect(await sweeper.sweep()).toBe(1);
      expect(await sweeper.sweep()).toBe(0);
      expect(await stockOf(variant.id)).toBe(10);
    });

    it('a late payment callback for a swept order does not mark it paid', async () => {
      const { orderId } = await placeOrder();
      const cb = await press(await startOk(orderId), 'pay');
      await age(orderId, 30);
      await sweeper.sweep();

      const res = await callback(cb);

      expect(res.headers.location).toBe('/orders');
      expect((await orderRow(orderId)).paymentStatus).toBe('FAILED');
    });
  });
});
