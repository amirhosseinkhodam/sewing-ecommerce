import { APIRequestContext, expect, test as base } from '@playwright/test';
import en from '../../frontend/src/app/i18n/en.json';
import fa from '../../frontend/src/app/i18n/fa.json';

export const ADMIN = { phone: '09120000000', password: 'admin12345' };
const PASSWORD = 'password123';

type Language = 'en' | 'fa';
const dictionaries: Record<Language, Record<string, unknown>> = { en, fa };

function lookup(dictionary: Record<string, unknown>, key: string): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      dictionary,
    );
  if (typeof value !== 'string') throw new Error(`Missing translation: ${key}`);
  return value;
}

interface Fixtures {
  language: Language;
  /** Translates a key into the language this project runs in. */
  t: (key: string) => string;
}

/**
 * Every journey runs once per language. Assertions go through `t()` so the
 * same spec checks both the English and the Persian UI.
 */
let clientCounter = 0;

export const test = base.extend<Fixtures>({
  // The server rate-limits per client IP (register 5/min, login 10/min) and
  // trusts one proxy hop, so each test presents as its own client. This keeps
  // the production throttle on while journeys run back to back.
  extraHTTPHeaders: async ({}, use) => {
    clientCounter += 1;
    const n = clientCounter + (process.pid % 200) * 1000;
    await use({
      'X-Forwarded-For': `10.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`,
    });
  },
  language: async ({}, use, testInfo) => {
    await use(testInfo.project.metadata.language as Language);
  },
  t: async ({ language }, use) => {
    await use((key) => lookup(dictionaries[language], key));
  },
  page: async ({ page, language }, use) => {
    await page.addInitScript((lang) => {
      // Only the first visit: a language the user switches to must survive reloads.
      if (!localStorage.getItem('app-language')) {
        localStorage.setItem('app-language', lang);
      }
    }, language);
    await use(page);
  },
});

export { expect };

let counter = 0;
/** A unique, valid Iranian mobile number per call. */
export function uniquePhone(): string {
  counter += 1;
  const tail = String((Date.now() + counter) % 1_000_000_00).padStart(8, '0');
  return `091${tail}`.slice(0, 11);
}

export async function loginApi(
  request: APIRequestContext,
  phone: string,
  password: string,
) {
  const res = await request.post('/api/auth/login', {
    data: { phone, password },
  });
  expect(res.ok()).toBe(true);
  const body = await res.json();
  return { token: body.accessToken as string, user: body.user };
}

export async function adminToken(request: APIRequestContext) {
  return (await loginApi(request, ADMIN.phone, ADMIN.password)).token;
}

export interface SeededProduct {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly variantId: string;
}

let productCounter = 0;
/** Creates a category and a product with one size-M variant through the admin API. */
export async function createProduct(
  request: APIRequestContext,
  { price = 100000, stock = 10 } = {},
): Promise<SeededProduct> {
  productCounter += 1;
  const stamp = `${Date.now()}-${productCounter}`;
  const headers = { Authorization: `Bearer ${await adminToken(request)}` };
  const category = await request.post('/api/admin/categories', {
    headers,
    data: { name: `Cat ${stamp}`, slug: `cat-${stamp}` },
  });
  expect(category.ok()).toBe(true);
  const res = await request.post('/api/admin/products', {
    headers,
    data: {
      name: `Product ${stamp}`,
      slug: `product-${stamp}`,
      price,
      images: [],
      categoryId: (await category.json()).id,
      variants: [{ size: 'M', stock }],
    },
  });
  expect(res.ok()).toBe(true);
  const product = await res.json();
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    variantId: product.variants[0].id,
  };
}

export async function registerApi(request: APIRequestContext) {
  const phone = uniquePhone();
  const res = await request.post('/api/auth/register', {
    data: { firstName: 'Sara', lastName: 'Ahmadi', phone, password: PASSWORD },
  });
  expect(res.ok()).toBe(true);
  const body = await res.json();
  return { phone, password: PASSWORD, token: body.accessToken as string };
}

export { PASSWORD };
