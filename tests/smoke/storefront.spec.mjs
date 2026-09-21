import { expect, test } from '@playwright/test';

test('storefront responds with a visible document', async ({ page }) => {
  test.skip(!process.env.SHOPIFY_STOREFRONT_URL, 'Set SHOPIFY_STOREFRONT_URL to run storefront smoke tests.');

  const response = await page.goto(process.env.SHOPIFY_STOREFRONT_URL, {
    waitUntil: 'domcontentloaded',
  });

  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(500);
  await expect(page.locator('body')).toBeVisible();
  expect((await page.locator('body').innerText()).trim()).not.toHaveLength(0);
});

