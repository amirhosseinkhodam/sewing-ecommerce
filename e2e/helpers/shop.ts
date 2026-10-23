import { Page } from '@playwright/test';
import { expect } from './test';

type Translate = (key: string) => string;

export async function signIn(
  page: Page,
  t: Translate,
  phone: string,
  password: string,
) {
  await page.goto('/login');
  await page.getByLabel(t('phone')).fill(phone);
  await page.getByLabel(t('password'), { exact: true }).fill(password);
  await page.locator('app-signal-form button[type=submit]').click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function selectSizeAndAdd(page: Page, t: Translate) {
  await page.getByRole('button', { name: 'M', exact: true }).click();
  await page.getByRole('button', { name: t('addToCart') }).click();
}

/** Fills the inline address form the checkout shows when there is no address yet. */
export async function fillAddress(page: Page, t: Translate) {
  await page.getByLabel(t('addressLabel')).fill('Home');
  await page
    .locator('app-address-form')
    .getByLabel(t('phone'))
    .fill('09121234567');
  await page.getByLabel(t('province')).fill('Tehran');
  await page.getByLabel(t('city')).fill('Tehran');
  await page.getByLabel(t('fullAddress')).fill('Valiasr St, No. 1');
  await page.getByLabel(t('postalCode')).fill('1234567890');
  await page
    .locator('app-address-form')
    .getByRole('button', { name: t('save') })
    .click();
}

export async function nextStep(page: Page, t: Translate) {
  await page.getByRole('button', { name: t('continue') }).click();
}

/** Walks checkout from the address step to a placed order. */
export async function checkout(
  page: Page,
  t: Translate,
  payment: 'cardToCard' | 'online',
) {
  await page.goto('/checkout');
  await page.getByRole('button', { name: t('addNewAddress') }).click();
  await fillAddress(page, t);
  await nextStep(page, t);
  await page.locator('h2', { hasText: t('shippingMethod') }).waitFor();
  await page.locator('app-card button').first().click();
  await nextStep(page, t);
  await page.locator('h2', { hasText: t('paymentMethod') }).waitFor();
  const methods = page.locator('app-card button');
  await methods.nth(payment === 'online' ? 0 : 1).click();
  await nextStep(page, t);
  await page.getByRole('button', { name: t('placeOrder') }).click();
}
