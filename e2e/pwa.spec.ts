import { expect, test } from './helpers/test';

test.describe('pwa', () => {
  test('manifest is installable and the service worker files are revalidated', async ({
    request,
  }) => {
    const manifestRes = await request.get('/manifest.webmanifest');
    expect(manifestRes.ok()).toBe(true);
    expect(manifestRes.headers()['cache-control']).toBe('no-cache');
    const manifest = await manifestRes.json();
    expect(manifest.display).toBe('standalone');
    expect(manifest.dir).toBe('rtl');
    const purposes = manifest.icons.map(
      (icon: { purpose: string }) => icon.purpose,
    );
    expect(purposes).toContain('maskable');

    for (const file of ['/ngsw-worker.js', '/ngsw.json', '/index.html']) {
      const res = await request.get(file);
      expect(res.ok(), file).toBe(true);
      expect(res.headers()['cache-control'], file).toBe('no-cache');
    }
  });

  test('the service worker never caches /api responses', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(
      async () =>
        (await navigator.serviceWorker.getRegistration())?.active != null,
      undefined,
      { timeout: 45_000 },
    );
    await page.reload();
    await page.evaluate(() => fetch('/api/payment/methods'));
    await page.evaluate(() => fetch('/api/categories'));

    const cachedUrls = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const name of await caches.keys()) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) urls.push(request.url);
      }
      return urls;
    });
    expect(cachedUrls.length).toBeGreaterThan(0);
    expect(cachedUrls.filter((url) => url.includes('/api/'))).toEqual([]);
  });
});
