import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { Role } from '../src/generated/prisma/client';
import { createSession } from './helpers/auth';
import { createTestApp, resetDatabase } from './helpers/app';

describe('catalog', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string;
  let customer: string;

  const http = () => request(app.getHttpServer());

  const makeCategory = (slug: string, extra: object = {}) =>
    prisma.category.create({ data: { name: slug, slug, ...extra } });

  const makeProduct = (
    categoryId: string,
    slug: string,
    price: number,
    extra: object = {},
  ) =>
    prisma.product.create({
      data: { name: slug, slug, price, images: [], categoryId, ...extra },
    });

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    admin = (await createSession(app, prisma, Role.ADMIN)).bearer;
    customer = (await createSession(app, prisma, Role.CUSTOMER)).bearer;
  });

  describe('categories', () => {
    it('lists only active categories publicly, ordered by sortOrder then name', async () => {
      await makeCategory('b-second', { sortOrder: 2 });
      await makeCategory('a-first', { sortOrder: 1 });
      await makeCategory('hidden', { isActive: false });

      const res = await http().get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.map((c: { slug: string }) => c.slug)).toEqual([
        'a-first',
        'b-second',
      ]);
    });

    it('lets the admin see inactive categories too', async () => {
      await makeCategory('visible');
      await makeCategory('hidden', { isActive: false });

      const res = await http()
        .get('/api/admin/categories')
        .set('Authorization', admin);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('admin-only: 401 anonymous, 403 customer on create', async () => {
      const body = { name: 'Dresses', slug: 'dresses' };

      const anonymous = await http().post('/api/admin/categories').send(body);
      const asCustomer = await http()
        .post('/api/admin/categories')
        .set('Authorization', customer)
        .send(body);

      expect(anonymous.status).toBe(401);
      expect(asCustomer.status).toBe(403);
      expect(await prisma.category.count()).toBe(0);
    });

    it('creates, updates and deletes a category as admin', async () => {
      const created = await http()
        .post('/api/admin/categories')
        .set('Authorization', admin)
        .send({ name: 'Dresses', slug: 'dresses' });
      expect(created.status).toBe(201);
      expect(created.body.slug).toBe('dresses');

      const updated = await http()
        .patch(`/api/admin/categories/${created.body.id}`)
        .set('Authorization', admin)
        .send({ description: 'All dresses' });
      expect(updated.status).toBe(200);
      expect(updated.body.description).toBe('All dresses');

      const removed = await http()
        .delete(`/api/admin/categories/${created.body.id}`)
        .set('Authorization', admin);
      expect(removed.status).toBe(200);
      expect(await prisma.category.count()).toBe(0);
    });

    it('generates a slug from the name when none is given', async () => {
      const res = await http()
        .post('/api/admin/categories')
        .set('Authorization', admin)
        .send({ name: 'Linen' });

      expect(res.status).toBe(201);
      expect(res.body.slug).toEqual(expect.any(String));
      expect(res.body.slug).not.toBe('');
    });

    it('404s when updating or deleting an unknown category', async () => {
      const id = '00000000-0000-4000-8000-000000000000';

      const patch = await http()
        .patch(`/api/admin/categories/${id}`)
        .set('Authorization', admin)
        .send({ name: 'x' });
      const del = await http()
        .delete(`/api/admin/categories/${id}`)
        .set('Authorization', admin);

      expect(patch.status).toBe(404);
      expect(del.status).toBe(404);
    });

    it('refuses to delete a category that still has products (409)', async () => {
      const category = await makeCategory('shirts');
      await makeProduct(category.id, 'shirt-1', 1000);

      const res = await http()
        .delete(`/api/admin/categories/${category.id}`)
        .set('Authorization', admin);

      expect(res.status).toBe(409);
      expect(await prisma.category.count()).toBe(1);
    });

    it('refuses to delete a category that still has portfolio items (409)', async () => {
      const category = await makeCategory('shirts');
      await prisma.portfolio.create({
        data: {
          title: 'Work',
          slug: 'work',
          images: [],
          categoryId: category.id,
        },
      });

      const res = await http()
        .delete(`/api/admin/categories/${category.id}`)
        .set('Authorization', admin);

      expect(res.status).toBe(409);
    });
  });

  describe('public product listing', () => {
    it('hides inactive products from the public but not from the admin list', async () => {
      const category = await makeCategory('shirts');
      await makeProduct(category.id, 'live', 1000);
      await makeProduct(category.id, 'draft', 1000, { isActive: false });

      const pub = await http().get('/api/products');
      const adm = await http()
        .get('/api/admin/products')
        .set('Authorization', admin);

      expect(pub.body.total).toBe(1);
      expect(pub.body.items[0].slug).toBe('live');
      expect(adm.body.total).toBe(2);
    });

    it('serializes price as a string and includes category and variants', async () => {
      const category = await makeCategory('shirts');
      const product = await makeProduct(category.id, 'shirt', 1500);
      await prisma.productVariant.create({
        data: { productId: product.id, size: 'M', stock: 3 },
      });

      const res = await http().get('/api/products');

      const item = res.body.items[0];
      expect(typeof item.price).toBe('string');
      expect(Number(item.price)).toBe(1500);
      expect(item.category.slug).toBe('shirts');
      expect(item.variants).toEqual([
        expect.objectContaining({ size: 'M', stock: 3 }),
      ]);
    });

    it('paginates with page, pageSize, total and totalPages', async () => {
      const category = await makeCategory('shirts');
      for (let i = 1; i <= 5; i += 1) {
        await makeProduct(category.id, `p${i}`, i * 100);
      }

      const last = await http().get('/api/products?page=3&pageSize=2');
      const beyond = await http().get('/api/products?page=9&pageSize=2');

      expect(last.body).toEqual(
        expect.objectContaining({
          total: 5,
          page: 3,
          pageSize: 2,
          totalPages: 3,
        }),
      );
      expect(last.body.items).toHaveLength(1);
      expect(beyond.body.items).toEqual([]);
    });

    it('defaults to page 1 with 12 items per page', async () => {
      const res = await http().get('/api/products');

      expect(res.body).toEqual(
        expect.objectContaining({ page: 1, pageSize: 12, total: 0 }),
      );
    });

    it('sorts by price ascending and descending', async () => {
      const category = await makeCategory('shirts');
      await makeProduct(category.id, 'mid', 200);
      await makeProduct(category.id, 'low', 100);
      await makeProduct(category.id, 'high', 300);

      const asc = await http().get('/api/products?sort=priceAsc');
      const desc = await http().get('/api/products?sort=priceDesc');

      const slugs = (res: { body: { items: { slug: string }[] } }) =>
        res.body.items.map((p) => p.slug);
      expect(slugs(asc)).toEqual(['low', 'mid', 'high']);
      expect(slugs(desc)).toEqual(['high', 'mid', 'low']);
    });

    it('filters by category slug', async () => {
      const shirts = await makeCategory('shirts');
      const pants = await makeCategory('pants');
      await makeProduct(shirts.id, 'shirt', 100);
      await makeProduct(pants.id, 'trouser', 100);

      const res = await http().get('/api/products?category=pants');

      expect(res.body.items.map((p: { slug: string }) => p.slug)).toEqual([
        'trouser',
      ]);
    });

    it('filters by minPrice and maxPrice (inclusive)', async () => {
      const category = await makeCategory('shirts');
      await makeProduct(category.id, 'cheap', 100);
      await makeProduct(category.id, 'mid', 200);
      await makeProduct(category.id, 'pricey', 300);

      const res = await http().get('/api/products?minPrice=200&maxPrice=300');
      const upTo = await http().get('/api/products?maxPrice=100');

      expect(res.body.items.map((p: { slug: string }) => p.slug).sort()).toEqual(
        ['mid', 'pricey'],
      );
      expect(upTo.body.total).toBe(1);
    });

    it('searches name and description case-insensitively', async () => {
      const category = await makeCategory('shirts');
      await makeProduct(category.id, 'linen-shirt', 100, {
        name: 'Linen Shirt',
      });
      await makeProduct(category.id, 'wool-coat', 100, {
        name: 'Coat',
        description: 'Warm WOOL coat',
      });
      await makeProduct(category.id, 'other', 100, { name: 'Other' });

      const byName = await http().get('/api/products?search=linen');
      const byDescription = await http().get('/api/products?search=wool');

      expect(byName.body.items.map((p: { slug: string }) => p.slug)).toEqual([
        'linen-shirt',
      ]);
      expect(
        byDescription.body.items.map((p: { slug: string }) => p.slug),
      ).toEqual(['wool-coat']);
    });

    it('filters featured products', async () => {
      const category = await makeCategory('shirts');
      await makeProduct(category.id, 'star', 100, { isFeatured: true });
      await makeProduct(category.id, 'plain', 100);

      const featured = await http().get('/api/products?isFeatured=true');
      const notFeatured = await http().get('/api/products?isFeatured=false');

      expect(featured.body.items.map((p: { slug: string }) => p.slug)).toEqual([
        'star',
      ]);
      expect(
        notFeatured.body.items.map((p: { slug: string }) => p.slug),
      ).toEqual(['plain']);
    });

    it.each([
      ['page=0'],
      ['page=abc'],
      ['pageSize=0'],
      ['pageSize=51'],
      ['sort=cheapest'],
      ['minPrice=-1'],
    ])('rejects invalid query %s with 400', async (qs) => {
      const res = await http().get(`/api/products?${qs}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/products/:slug', () => {
    it('returns an active product with its variants', async () => {
      const category = await makeCategory('shirts');
      const product = await makeProduct(category.id, 'shirt', 100);
      await prisma.productVariant.createMany({
        data: [
          { productId: product.id, size: 'M', stock: 1 },
          { productId: product.id, size: 'L', stock: 2 },
        ],
      });

      const res = await http().get('/api/products/shirt');

      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('shirt');
      expect(res.body.variants).toHaveLength(2);
    });

    it('404s for an unknown or inactive product', async () => {
      const category = await makeCategory('shirts');
      await makeProduct(category.id, 'draft', 100, { isActive: false });

      const unknown = await http().get('/api/products/nope');
      const inactive = await http().get('/api/products/draft');

      expect(unknown.status).toBe(404);
      expect(inactive.status).toBe(404);
    });
  });

  describe('admin product CRUD', () => {
    it('is admin-only: 401 anonymous, 403 customer', async () => {
      const category = await makeCategory('shirts');
      const body = { name: 'Shirt', price: 100, categoryId: category.id };

      const anonymous = await http().post('/api/admin/products').send(body);
      const asCustomer = await http()
        .post('/api/admin/products')
        .set('Authorization', customer)
        .send(body);
      const listAsCustomer = await http()
        .get('/api/admin/products')
        .set('Authorization', customer);

      expect(anonymous.status).toBe(401);
      expect(asCustomer.status).toBe(403);
      expect(listAsCustomer.status).toBe(403);
      expect(await prisma.product.count()).toBe(0);
    });

    it('creates a product with variants and a variant price override', async () => {
      const category = await makeCategory('shirts');

      const res = await http()
        .post('/api/admin/products')
        .set('Authorization', admin)
        .send({
          name: 'Linen Shirt',
          slug: 'linen-shirt',
          price: 1500,
          categoryId: category.id,
          images: ['/uploads/a.png'],
          variants: [
            { size: 'M', stock: 5 },
            { size: 'L', stock: 2, price: 1800 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.slug).toBe('linen-shirt');
      expect(res.body.images).toEqual(['/uploads/a.png']);
      expect(res.body.isActive).toBe(true);
      const large = res.body.variants.find(
        (v: { size: string }) => v.size === 'L',
      );
      expect(Number(large.price)).toBe(1800);
      const medium = res.body.variants.find(
        (v: { size: string }) => v.size === 'M',
      );
      expect(medium.price).toBeNull();
    });

    it('rejects an unknown category with 400', async () => {
      const res = await http()
        .post('/api/admin/products')
        .set('Authorization', admin)
        .send({
          name: 'Shirt',
          price: 100,
          categoryId: '00000000-0000-4000-8000-000000000000',
        });

      expect(res.status).toBe(400);
      expect(await prisma.product.count()).toBe(0);
    });

    it.each([
      ['missing name', { price: 100 }],
      ['zero price', { name: 'x', price: 0 }],
      ['negative price', { name: 'x', price: -5 }],
      ['non-uuid category', { name: 'x', price: 1, categoryId: 'abc' }],
      [
        'negative stock',
        { name: 'x', price: 1, variants: [{ size: 'M', stock: -1 }] },
      ],
      [
        'fractional stock',
        { name: 'x', price: 1, variants: [{ size: 'M', stock: 1.5 }] },
      ],
    ])('rejects %s with 400', async (_label, partial) => {
      const category = await makeCategory('shirts');

      const res = await http()
        .post('/api/admin/products')
        .set('Authorization', admin)
        .send({ categoryId: category.id, ...partial });

      expect(res.status).toBe(400);
      expect(await prisma.product.count()).toBe(0);
    });

    it('rejects a duplicate slug instead of silently overwriting', async () => {
      const category = await makeCategory('shirts');
      await makeProduct(category.id, 'taken', 100);

      const res = await http()
        .post('/api/admin/products')
        .set('Authorization', admin)
        .send({
          name: 'Other',
          slug: 'taken',
          price: 100,
          categoryId: category.id,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Slug already in use');
      expect(await prisma.product.count()).toBe(1);
    });

    it('rejects a duplicate slug on category create and product update', async () => {
      const category = await makeCategory('shirts');
      await makeProduct(category.id, 'taken', 100);
      const other = await makeProduct(category.id, 'other', 100);

      const dupCategory = await http()
        .post('/api/admin/categories')
        .set('Authorization', admin)
        .send({ name: 'Again', slug: 'shirts' });
      const dupUpdate = await http()
        .patch(`/api/admin/products/${other.id}`)
        .set('Authorization', admin)
        .send({ slug: 'taken' });

      expect(dupCategory.status).toBe(409);
      expect(dupUpdate.status).toBe(409);
    });

    it('updates fields and leaves the rest untouched', async () => {
      const category = await makeCategory('shirts');
      const product = await makeProduct(category.id, 'shirt', 100, {
        fabric: 'cotton',
      });

      const res = await http()
        .patch(`/api/admin/products/${product.id}`)
        .set('Authorization', admin)
        .send({ price: 250, isFeatured: true });

      expect(res.status).toBe(200);
      expect(Number(res.body.price)).toBe(250);
      expect(res.body.isFeatured).toBe(true);
      expect(res.body.fabric).toBe('cotton');
      expect(res.body.slug).toBe('shirt');
    });

    it('replaces the variant set when variants are sent, keeps it when omitted', async () => {
      const category = await makeCategory('shirts');
      const product = await makeProduct(category.id, 'shirt', 100);
      await prisma.productVariant.create({
        data: { productId: product.id, size: 'S', stock: 1 },
      });

      const untouched = await http()
        .patch(`/api/admin/products/${product.id}`)
        .set('Authorization', admin)
        .send({ fabric: 'wool' });
      expect(untouched.body.variants.map((v: { size: string }) => v.size)).toEqual(
        ['S'],
      );

      const replaced = await http()
        .patch(`/api/admin/products/${product.id}`)
        .set('Authorization', admin)
        .send({ variants: [{ size: 'XL', stock: 9 }] });
      expect(replaced.body.variants.map((v: { size: string }) => v.size)).toEqual(
        ['XL'],
      );
      expect(await prisma.productVariant.count()).toBe(1);
    });

    it('404s when updating an unknown product', async () => {
      const res = await http()
        .patch('/api/admin/products/00000000-0000-4000-8000-000000000000')
        .set('Authorization', admin)
        .send({ price: 1 });

      expect(res.status).toBe(404);
    });

    it('deletes a product together with its variants', async () => {
      const category = await makeCategory('shirts');
      const product = await makeProduct(category.id, 'shirt', 100);
      await prisma.productVariant.create({
        data: { productId: product.id, size: 'S', stock: 1 },
      });

      const res = await http()
        .delete(`/api/admin/products/${product.id}`)
        .set('Authorization', admin);

      expect(res.status).toBe(200);
      expect(await prisma.product.count()).toBe(0);
      expect(await prisma.productVariant.count()).toBe(0);
    });

    it('gets a single product by id, including inactive ones', async () => {
      const category = await makeCategory('shirts');
      const product = await makeProduct(category.id, 'draft', 100, {
        isActive: false,
      });

      const res = await http()
        .get(`/api/admin/products/${product.id}`)
        .set('Authorization', admin);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(product.id);
    });
  });
});
