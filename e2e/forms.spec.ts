import { fillAddress, signIn } from './helpers/shop';
import { expect, registerApi, test, uniquePhone } from './helpers/test';

test.describe('forms sharing the phone and name rules', () => {
  test('contact form rejects a bad phone and a short message, then sends', async ({
    page,
    t,
  }) => {
    await page.goto('/contact');
    await page.getByLabel(t('name'), { exact: true }).fill('Sara');
    await page.getByLabel(t('phoneNumber')).fill('123');
    await page.getByLabel(t('message'), { exact: true }).fill('short');
    await page.getByRole('button', { name: t('sendMessage') }).click();
    await expect(page.getByText(t('validation.invalidPhone'))).toBeVisible();

    await page.getByLabel(t('phoneNumber')).fill(uniquePhone());
    await page
      .getByLabel(t('message'), { exact: true })
      .fill('Hello, I have a question about sizes.');
    await page.getByRole('button', { name: t('sendMessage') }).click();
    await expect(page.getByText(t('messageSent'))).toBeVisible();
  });

  test('profile edit validates, saves and survives a reload', async ({
    page,
    request,
    t,
  }) => {
    const { phone, password } = await registerApi(request);
    await signIn(page, t, phone, password);
    await page.goto('/profile');
    await page.getByRole('button', { name: t('editProfile') }).click();

    await page.getByLabel(t('phone')).fill('0812');
    await page.getByLabel(t('firstName'), { exact: true }).fill('A1');
    await page.getByRole('button', { name: t('save') }).click();
    await expect(page.getByText(t('validation.invalidPhone'))).toBeVisible();
    await expect(page.getByText(t('validation.invalidChars'))).toBeVisible();

    const newPhone = uniquePhone();
    await page.getByLabel(t('phone')).fill(newPhone);
    await page.getByLabel(t('firstName'), { exact: true }).fill('Nima');
    await page.getByRole('button', { name: t('save') }).click();
    await expect(page.getByText(t('profileUpdated'))).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Nima');
    await expect(page.getByText(newPhone).first()).toBeVisible();
  });

  test('an address can be added and edited on the addresses page', async ({
    page,
    request,
    t,
  }) => {
    const { phone, password } = await registerApi(request);
    await signIn(page, t, phone, password);
    await page.goto('/addresses');
    await page
      .getByRole('button', { name: t('addAddress') })
      .first()
      .click();
    await fillAddress(page, t);
    await expect(page.getByText('Valiasr St, No. 1')).toBeVisible();

    await page.getByRole('button', { name: t('edit') }).click();
    await page.getByLabel(t('fullAddress')).fill('Enghelab St, No. 9');
    await page
      .locator('app-address-form')
      .getByRole('button', { name: t('save') })
      .click();
    await expect(page.getByText('Enghelab St, No. 9')).toBeVisible();
  });
});
