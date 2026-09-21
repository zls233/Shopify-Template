import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env' });
loadDotenv({ path: '.env.local', override: true });

const DEFAULT_API_VERSION = '2025-10';

export function normalizeStore(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\/$/, '')
    .toLowerCase();
}

export function getAdminConfig({ store, token, apiVersion } = {}) {
  const normalizedStore = normalizeStore(store || process.env.SHOPIFY_STORE);
  const accessToken = token || process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  const version = apiVersion || process.env.SHOPIFY_API_VERSION || DEFAULT_API_VERSION;

  if (!normalizedStore || !normalizedStore.endsWith('.myshopify.com')) {
    throw new Error('Set SHOPIFY_STORE to a valid *.myshopify.com domain or pass --store.');
  }
  if (!accessToken) {
    throw new Error('Set SHOPIFY_ADMIN_API_ACCESS_TOKEN in .env.local before using the Admin API.');
  }

  return { store: normalizedStore, token: accessToken, apiVersion: version };
}

export async function adminGraphql(query, variables = {}, adminConfig = getAdminConfig()) {
  const response = await fetch(
    `https://${adminConfig.store}/admin/api/${adminConfig.apiVersion}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminConfig.token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  if (!response.ok) {
    throw new Error(`Shopify Admin API returned HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    const messages = payload.errors.map((error) => error.message).join('; ');
    throw new Error(`Shopify GraphQL request failed: ${messages}`);
  }

  return payload.data;
}

