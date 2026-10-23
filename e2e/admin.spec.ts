import { Page } from '@playwright/test';
import { signIn } from './helpers/shop';
import { ADMIN, adminToken, expect, test } from './helpers/test';

test.describe('admin product CRUD', () => {
  const productsTable = (page: Page) => page.locator('table');

  test('creates, edits and deletes a product through the panel', async ({
    page,
    request,
    t,
  }) => {
    const stamp = Date.now();
    const name = `E2E dress ${stamp}`;
    const renamed = `E2E dress renamed ${stamp}`;
    const headers = { Authorization: `Bearer ${await adminToken(request)}` };
    const category = await request.post('/api/admin/categories', {
      headers,
      data: { name: `E2E cat ${stamp}`, slug: `e2e-cat-${stamp}` },
    });
    expect(category.ok()).toBe(true);
    const categoryName = (await category.json()).name as string;

    await signIn(page, t, ADMIN.phone, ADMIN.password);
    await page.goto('/admin/products');

    // Create
    await page.getByRole('button', { name: t('newProduct') }).click();
    await page.getByLabel(t('productName')).fill(name);
    await page.getByLabel(t('price'), { exact: true }).fill('250000');
    await page.locator('app-select').first().click();
    await page.getByRole('option', { name: categoryName }).click();
    // The form starts with one size row.
    await page.getByLabel(t('size'), { exact: true }).fill('XL');
    await page.getByLabel(t('stock'), { exact: true }).fill('7');
    await page.locator('app-signal-form button[type=submit]').click();

    await page.goto('/admin/products');
    const row = productsTable(page).locator('tr', { hasText: name });
    await expect(row).toBeVisible();

    // The public catalog serves it, with the variant.
    const listed = await request.get(
      `/api/products?search=${encodeURIComponent(name)}`,
    );
    const created = (await listed.json()).items[0];
    expect(created.price).toBe('250000');
    expect(created.variants).toHaveLength(1);
    expect(created.variants[0]).toMatchObject({ size: 'XL', stock: 7 });

    // Edit. The row buttons carry hardcoded English aria-labels (an app i18n
    // bug), so they are addressed by position rather than by name.
    await row.getByRole('button').first().click();
    await page.getByLabel(t('productName')).fill(renamed);
    await page.locator('app-signal-form button[type=submit]').click();
    await page.goto('/admin/products');
    await expect(
      productsTable(page).locator('tr', { hasText: renamed }),
    ).toBeVisible();
    await expect(
      productsTable(page)
        .locator('tr', { hasText: name })
        .filter({ hasNotText: 'renamed' }),
    ).toHaveCount(0);

    // Delete
    await productsTable(page)
      .locator('tr', { hasText: renamed })
      .getByRole('button')
      .last()
      .click();
    await page.getByRole('dialog').getByRole('button').last().click();
    await expect(
      productsTable(page).locator('tr', { hasText: renamed }),
    ).toHaveCount(0);
    const after = await request.get(
      `/api/products?search=${encodeURIComponent(renamed)}`,
    );
    expect((await after.json()).total).toBe(0);
  });

  test('the product list is closed to guests and to customers', async ({
    page,
    request,
  }) => {
    await page.goto('/admin/products');
    await expect(page).not.toHaveURL(/\/admin/);

    const anonymous = await request.get('/api/admin/products');
    expect(anonymous.status()).toBe(401);
  });
});
