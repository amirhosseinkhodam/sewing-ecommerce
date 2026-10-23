import { checkout, selectSizeAndAdd, signIn } from './helpers/shop';
import {
  ADMIN,
  createProduct,
  expect,
  PASSWORD,
  test,
  uniquePhone,
} from './helpers/test';

test.describe('customer journey', () => {
  test('guest registers, fills the cart and pays card-to-card; admin confirms', async ({
    page,
    browser,
    request,
    t,
  }) => {
    const product = await createProduct(request, { price: 100000, stock: 5 });
    const phone = uniquePhone();
    // The register form requires upper case, lower case and a digit.
    const strongPassword = 'Password123';

    // A guest adding to the cart is sent to sign in, and returns to the product.
    await page.goto(`/products/${product.slug}`);
    await selectSizeAndAdd(page, t);
    await expect(page).toHaveURL(/\/login\?.*returnUrl/);

    // The login page links to registration; the product page is the return target.
    await page.getByRole('main').locator('a[href^="/register"]').click();
    await page.getByLabel(t('firstName'), { exact: true }).fill('Sara');
    await page.getByLabel(t('lastName'), { exact: true }).fill('Ahmadi');
    await page.getByLabel(t('phone')).fill(phone);
    await page.getByLabel(t('password'), { exact: true }).fill(strongPassword);
    await page.getByLabel(t('confirmPassword')).fill(strongPassword);
    await page.locator('app-signal-form button[type=submit]').click();
    await expect(page).toHaveURL(new RegExp(`/products/${product.slug}`));

    // The pending add completes after sign-in.
    await page.goto('/cart');
    await expect(page.getByText(product.name)).toBeVisible();

    await checkout(page, t, 'cardToCard');
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}/);
    await expect(page.getByText(t('cardToCardInstructions'))).toBeVisible();
    const orderUrl = page.url();
    const orderId = orderUrl.split('/').pop()!;

    // Admin confirms the payment from the admin panel.
    const adminPage = await (await browser.newContext()).newPage();
    await adminPage.addInitScript(
      (lang) => {
        localStorage.setItem('app-language', lang);
      },
      t('login') === 'Login' ? 'en' : 'fa',
    );
    await signIn(adminPage, t, ADMIN.phone, ADMIN.password);
    await adminPage.goto(`/admin/orders/${orderId}`);
    await adminPage.getByRole('button', { name: t('markAsPaid') }).click();
    await expect(adminPage.getByText(t('paymentPaid')).first()).toBeVisible();

    // The customer now sees a paid, confirmed order.
    await page.reload();
    await expect(page.getByText(t('paymentPaid')).first()).toBeVisible();
    await expect(page.getByText(t('statusConfirmed')).first()).toBeVisible();
    await adminPage.context().close();
  });

  test('cancelling restores stock so the size can be bought again', async ({
    page,
    request,
    t,
  }) => {
    const product = await createProduct(request, { stock: 1 });
    const phone = uniquePhone();
    const res = await request.post('/api/auth/register', {
      data: { firstName: 'A', lastName: 'B', phone, password: PASSWORD },
    });
    expect(res.ok()).toBe(true);
    await signIn(page, t, phone, PASSWORD);

    await page.goto(`/products/${product.slug}`);
    await selectSizeAndAdd(page, t);
    await page.goto('/cart');
    await checkout(page, t, 'cardToCard');
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}/);

    const stock = async () =>
      (await (await request.get(`/api/products/${product.slug}`)).json())
        .variants[0].stock;
    expect(await stock()).toBe(0);

    await page.getByRole('button', { name: t('cancelOrder') }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: t('confirm') })
      .click();
    await expect(page.getByText(t('statusCancelled')).first()).toBeVisible();
    await expect.poll(stock).toBe(1);
  });

  test('the cart and checkout are closed to guests', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fcart/);

    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fcheckout/);
  });

  test('a customer cannot open the admin panel', async ({
    page,
    request,
    t,
  }) => {
    const phone = uniquePhone();
    await request.post('/api/auth/register', {
      data: { firstName: 'A', lastName: 'B', phone, password: PASSWORD },
    });
    await signIn(page, t, phone, PASSWORD);

    await page.goto('/admin');

    await expect(page).not.toHaveURL(/\/admin/);
  });
});

test.describe('online payment', () => {
  const place = async (
    page: import('@playwright/test').Page,
    request: import('@playwright/test').APIRequestContext,
    t: (key: string) => string,
  ) => {
    const product = await createProduct(request, { stock: 5 });
    const phone = uniquePhone();
    await request.post('/api/auth/register', {
      data: { firstName: 'A', lastName: 'B', phone, password: PASSWORD },
    });
    await signIn(page, t, phone, PASSWORD);
    await page.goto(`/products/${product.slug}`);
    await selectSizeAndAdd(page, t);
    await page.goto('/cart');
    await checkout(page, t, 'online');
  };

  test('pays at the fake bank and returns to a confirmed order', async ({
    page,
    request,
    t,
  }) => {
    await place(page, request, t);

    await expect(page).toHaveURL(/\/api\/payment\/fake\/FAKE-/);
    await page.getByRole('link', { name: 'Pay', exact: true }).click();

    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}\?payment=SUCCESS/);
    await expect(page.getByText(t('paymentSuccessBanner'))).toBeVisible();
    await expect(page.getByText(t('statusConfirmed')).first()).toBeVisible();
  });

  test('a failed payment can be retried and then succeeds', async ({
    page,
    request,
    t,
  }) => {
    await place(page, request, t);
    await expect(page).toHaveURL(/\/api\/payment\/fake\/FAKE-/);

    await page.getByRole('link', { name: /Fail/ }).click();
    await expect(page).toHaveURL(/payment=FAILED/);
    await expect(page.getByText(t('paymentFailedBanner'))).toBeVisible();

    await page.getByRole('button', { name: t('payAgain') }).click();
    await expect(page).toHaveURL(/\/api\/payment\/fake\/FAKE-/);
    await page.getByRole('link', { name: 'Pay', exact: true }).click();

    await expect(page).toHaveURL(/payment=SUCCESS/);
    await expect(page.getByText(t('paymentSuccessBanner'))).toBeVisible();
  });

  test('a forged Status=OK callback does not mark the order paid', async ({
    page,
    request,
    t,
  }) => {
    await place(page, request, t);
    await expect(page).toHaveURL(/\/api\/payment\/fake\/FAKE-/);
    const bank = new URL(page.url());
    const authority = bank.pathname.split('/').pop()!;

    const res = await request.get(
      `/api/payment/callback?Authority=${authority}&Status=OK`,
      { maxRedirects: 0 },
    );

    expect(res.status()).toBe(302);
    expect(res.headers()['location']).toContain('payment=FAILED');
  });
});
