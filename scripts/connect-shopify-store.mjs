import { spawnSync } from 'node:child_process';

const SCOPES = [
  'write_products', 'write_publications', 'write_online_store_navigation',
  'write_content', 'write_metaobjects', 'write_metaobject_definitions',
  'write_files', 'write_inventory', 'read_locations',
];
const QUERY = 'query StoreAccess { shop { myshopifyDomain } currentAppInstallation { app { apiKey title } accessScopes { handle } } }';

function storeFromArgs(argv) {
  const index = argv.indexOf('--store');
  const value = index < 0 ? '' : argv[index + 1];
  if (!value || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(value)) {
    throw new Error('Pass the exact target store: --store <store>.myshopify.com');
  }
  return value.toLowerCase();
}

function findData(value) {
  if (!value || typeof value !== 'object') return null;
  if (value.shop && value.currentAppInstallation) return value;
  for (const child of Object.values(value)) {
    const found = findData(child);
    if (found) return found;
  }
  return null;
}

function check(store) {
  const run = spawnSync('shopify', [
    'store', 'execute', '--store', store, '--query', QUERY, '--json',
  ], { encoding: 'utf8' });
  if (run.error) throw run.error;
  if (run.status !== 0) return { ok: false, retryAuth: true, reason: 'No usable Shopify CLI store authorization.' };

  let response;
  try {
    response = JSON.parse(run.stdout);
  } catch {
    return { ok: false, retryAuth: false, reason: 'Shopify CLI did not return parseable JSON.' };
  }
  const data = findData(response);
  if (!data) return { ok: false, retryAuth: false, reason: 'Shopify CLI did not return store and App installation data.' };
  const actualStore = data.shop?.myshopifyDomain?.toLowerCase();
  if (actualStore !== store) throw new Error(`Store mismatch: expected ${store}, received ${actualStore || 'unknown'}.`);

  const app = data.currentAppInstallation.app;
  const scopes = data.currentAppInstallation.accessScopes.map(({ handle }) => handle).sort();
  const missingScopes = SCOPES.filter((scope) => !scopes.includes(scope));
  return {
    ok: Boolean(app?.apiKey) && missingScopes.length === 0,
    store,
    app: app ? { title: app.title, clientId: app.apiKey } : null,
    scopes,
    missingScopes,
    retryAuth: !app?.apiKey || missingScopes.length > 0,
    reason: !app?.apiKey ? 'The CLI token has no identifiable App.' : missingScopes.length ? 'Missing granted site-building scopes.' : null,
  };
}

try {
  const store = storeFromArgs(process.argv.slice(2));
  let result = check(store);
  if (!result.ok) {
    console.error(result.reason);
    if (!result.retryAuth) throw new Error('Shopify CLI verification failed; authorization was not changed.');
    const auth = spawnSync('shopify', [
      'store', 'auth', '--store', store, '--scopes', SCOPES.join(','),
    ], { stdio: 'inherit' });
    if (auth.error) throw auth.error;
    if (auth.status !== 0) throw new Error('Shopify CLI authorization was not completed.');
    result = check(store);
  }
  const { retryAuth, ...output } = result;
  console.log(JSON.stringify(output, null, 2));
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
