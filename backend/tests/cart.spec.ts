import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { Role } from '../src/generated/prisma/client';
import { createSession } from './helpers/auth';
import { createTestApp, resetDatabase } from './helpers/app';
import { makeVariant } from './helpers/fixtures';

describe('cart', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let bearer: string;
  let otherBearer: string;

  const http = () => request(app.getHttpServer());
  const add = (token: string, productId: string, variantId: string, qty = 1) =>
    http()
      .post('/api/cart/items')
      .set('Authorization', token)
      .send({ productId, variantId, quantity: qty });

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    bearer = (await createSession(app, prisma, Role.CUSTOMER)).bearer;
    otherBearer = (
      await createSession(app, prisma, Role.CUSTOMER, '09122222222')
    ).bearer;
  });

  it('requires authentication on every route', async () => {
    expect((await http().get('/api/cart')).status).toBe(401);
    expect((await http().post('/api/cart/items').send({})).status).toBe(401);
    expect((await http().patch('/api/cart/items/x').send({})).status).toBe(401);
    expect((await http().delete('/api/cart/items/x')).status).toBe(401);
  });

  it('creates an empty cart on first read', async () => {
    const res = await http().get('/api/cart').set('Authorization', bearer);

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('adds an item with name, size, stock and unit price as a string', async () => {
    const { product, variant } = await makeVariant(prisma, { price: 120000 });

    const res = await add(bearer, product.id, variant.id, 2);

    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      productId: product.id,
      variantId: variant.id,
      quantity: 2,
      productName: product.name,
      size: 'M',
      stock: 10,
      unitPrice: '120000',
      productImage: product.images[0],
    });
  });

  it('prefers the variant price over the product price', async () => {
    const { product, variant } = await makeVariant(prisma, {
      price: 100000,
      variantPrice: 80000,
    });

    const res = await add(bearer, product.id, variant.id);

    expect(res.body.items[0].unitPrice).toBe('80000');
  });

  it('merges repeated adds of the same variant into one line', async () => {
    const { product, variant } = await makeVariant(prisma);

    await add(bearer, product.id, variant.id, 2);
    const res = await add(bearer, product.id, variant.id, 3);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(5);
  });

  describe('stock limits', () => {
    it('rejects adding more than the stock', async () => {
      const { product, variant } = await makeVariant(prisma, { stock: 3 });

      const res = await add(bearer, product.id, variant.id, 4);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Insufficient stock');
    });

    it('counts what is already in the cart against the stock', async () => {
      const { product, variant } = await makeVariant(prisma, { stock: 3 });
      await add(bearer, product.id, variant.id, 2);

      const res = await add(bearer, product.id, variant.id, 2);

      expect(res.status).toBe(400);
      const cart = await http().get('/api/cart').set('Authorization', bearer);
      expect(cart.body.items[0].quantity).toBe(2);
    });

    it('allows exactly the stock', async () => {
      const { product, variant } = await makeVariant(prisma, { stock: 3 });

      const res = await add(bearer, product.id, variant.id, 3);

      expect(res.status).toBe(201);
    });

    it('rejects an out-of-stock variant', async () => {
      const { product, variant } = await makeVariant(prisma, { stock: 0 });

      const res = await add(bearer, product.id, variant.id);

      expect(res.status).toBe(400);
    });

    it('does not reserve stock: adding to a cart leaves the variant stock alone', async () => {
      const { product, variant } = await makeVariant(prisma, { stock: 5 });

      await add(bearer, product.id, variant.id, 2);

      const after = await prisma.productVariant.findUniqueOrThrow({
        where: { id: variant.id },
      });
      expect(after.stock).toBe(5);
    });
  });

  describe('validation', () => {
    it('rejects quantity 0, negatives and fractions', async () => {
      const { product, variant } = await makeVariant(prisma);

      for (const quantity of [0, -1, 1.5]) {
        const res = await add(bearer, product.id, variant.id, quantity);
        expect(res.status).toBe(400);
      }
    });

    it('rejects non-UUID ids', async () => {
      const res = await http()
        .post('/api/cart/items')
        .set('Authorization', bearer)
        .send({ productId: 'nope', variantId: 'nope', quantity: 1 });

      expect(res.status).toBe(400);
    });

    it('404s for an unknown variant', async () => {
      const { product } = await makeVariant(prisma);

      const res = await add(
        bearer,
        product.id,
        '00000000-0000-4000-8000-000000000000',
      );

      expect(res.status).toBe(404);
    });

    it('404s when the variant belongs to a different product', async () => {
      const a = await makeVariant(prisma);
      const b = await makeVariant(prisma);

      const res = await add(bearer, a.product.id, b.variant.id);

      expect(res.status).toBe(404);
    });

    it('404s for an inactive product', async () => {
      const { product, variant } = await makeVariant(prisma, {
        isActive: false,
      });

      const res = await add(bearer, product.id, variant.id);

      expect(res.status).toBe(404);
    });
  });

  describe('update and remove', () => {
    it('sets the quantity of a line', async () => {
      const { product, variant } = await makeVariant(prisma);
      const cart = await add(bearer, product.id, variant.id, 1);

      const res = await http()
        .patch(`/api/cart/items/${cart.body.items[0].id}`)
        .set('Authorization', bearer)
        .send({ quantity: 4 });

      expect(res.status).toBe(200);
      expect(res.body.items[0].quantity).toBe(4);
    });

    it('rejects an update above the stock', async () => {
      const { product, variant } = await makeVariant(prisma, { stock: 2 });
      const cart = await add(bearer, product.id, variant.id, 1);

      const res = await http()
        .patch(`/api/cart/items/${cart.body.items[0].id}`)
        .set('Authorization', bearer)
        .send({ quantity: 3 });

      expect(res.status).toBe(400);
    });

    it('rejects quantity 0 on update', async () => {
      const { product, variant } = await makeVariant(prisma);
      const cart = await add(bearer, product.id, variant.id, 1);

      const res = await http()
        .patch(`/api/cart/items/${cart.body.items[0].id}`)
        .set('Authorization', bearer)
        .send({ quantity: 0 });

      expect(res.status).toBe(400);
    });

    it('removes a line', async () => {
      const { product, variant } = await makeVariant(prisma);
      const cart = await add(bearer, product.id, variant.id, 1);

      const res = await http()
        .delete(`/api/cart/items/${cart.body.items[0].id}`)
        .set('Authorization', bearer);

      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
    });

    it('404s for an unknown item id', async () => {
      const res = await http()
        .delete('/api/cart/items/00000000-0000-4000-8000-000000000000')
        .set('Authorization', bearer);

      expect(res.status).toBe(404);
    });
  });

  describe('ownership', () => {
    it('keeps carts separate per user', async () => {
      const { product, variant } = await makeVariant(prisma);
      await add(bearer, product.id, variant.id, 2);

      const res = await http()
        .get('/api/cart')
        .set('Authorization', otherBearer);

      expect(res.body.items).toEqual([]);
    });

    it("cannot update or delete another user's item, and the item survives", async () => {
      const { product, variant } = await makeVariant(prisma);
      const cart = await add(bearer, product.id, variant.id, 2);
      const itemId: string = cart.body.items[0].id;

      const patch = await http()
        .patch(`/api/cart/items/${itemId}`)
        .set('Authorization', otherBearer)
        .send({ quantity: 1 });
      const del = await http()
        .delete(`/api/cart/items/${itemId}`)
        .set('Authorization', otherBearer);

      expect(patch.status).toBe(404);
      expect(del.status).toBe(404);
      const item = await prisma.cartItem.findUniqueOrThrow({
        where: { id: itemId },
      });
      expect(item.quantity).toBe(2);
    });
  });
});
