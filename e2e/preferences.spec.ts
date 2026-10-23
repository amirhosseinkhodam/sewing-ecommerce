import { expect, test } from './helpers/test';

test.describe('language and theme', () => {
  test('switching language flips text, direction and survives a reload', async ({
    page,
    language,
    t,
  }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', language);
    await expect(html).toHaveAttribute(
      'dir',
      language === 'fa' ? 'rtl' : 'ltr',
    );
    await expect(
      page.getByRole('navigation').getByText(t('products')).first(),
    ).toBeVisible();

    const other = language === 'en' ? 'fa' : 'en';
    await page
      .getByRole('button', { name: /^(Switch language|تغییر زبان)/ })
      .first()
      .click();

    await expect(html).toHaveAttribute('lang', other);
    await expect(html).toHaveAttribute('dir', other === 'fa' ? 'rtl' : 'ltr');
    const flipped = other === 'en' ? 'Products' : 'محصولات';
    await expect(
      page.getByRole('navigation').getByText(flipped).first(),
    ).toBeVisible();

    await page.reload();
    await expect(html).toHaveAttribute('lang', other);
    expect(
      await page.evaluate(() => localStorage.getItem('app-language')),
    ).toBe(other);
  });

  test('dark mode toggles the class on <html> and is remembered', async ({
    page,
  }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    await page.getByRole('switch').first().click();
    await expect(html).toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem('app-theme'))).toBe(
      'dark',
    );

    await page.reload();
    await expect(html).toHaveClass(/dark/);

    await page.getByRole('switch').first().click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('guests browse the public pages without being sent to sign in', async ({
    page,
  }) => {
    for (const path of ['/', '/products', '/portfolio', '/about', '/contact']) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/$' : path}`));
    }
  });

  test('an unknown URL shows the not-found page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByRole('main')).toContainText(
      /404|not found|یافت نشد|پیدا نشد/i,
    );
  });
});
