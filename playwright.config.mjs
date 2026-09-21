import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/smoke',
  timeout: 30_000,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: process.env.SHOPIFY_STOREFRONT_URL || undefined,
    headless: true,
  },
});

