import { adminGraphql, getAdminConfig, normalizeStore } from './lib/shopify-admin.mjs';

const SITE_BUILD_SCOPES = [
  'write_products',
  'write_publications',
  'write_online_store_navigation',
  'write_content',
  'write_metaobjects',
  'write_metaobject_definitions',
  'write_files',
  'write_inventory',
  'read_locations',
];

function parseArgs(argv) {
  const args = { requiredScopes: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--store') args.store = argv[++index];
    else if (argument === '--app-client-id') args.appClientId = argv[++index];
    else if (argument === '--require-scope') args.requiredScopes.push(argv[++index]);
    else if (argument === '--site-build') args.siteBuild = true;
    else if (argument === '--json') args.json = true;
    else if (argument === '--help') args.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return args;
}

function reportFailure(code, message, nextStep) {
  console.log(JSON.stringify({ ok: false, code, message, nextStep }, null, 2));
  process.exitCode = 1;
}

function hasScope(grantedScopes, requiredScope) {
  return grantedScopes.includes(requiredScope)
    || (requiredScope.startsWith('read_') && grantedScopes.includes(`write_${requiredScope.slice(5)}`));
}

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  reportFailure('invalid_arguments', error.message, 'Run npm run verify:shopify -- --help for valid flags.');
}

if (args?.help) {
  console.log('Usage: npm run verify:shopify -- --store <store.myshopify.com> [--app-client-id <client-id>] [--require-scope <scope> ...] [--site-build]');
  process.exit(0);
}

if (args) {
  const targetStore = normalizeStore(args.store);
  const configuredStore = normalizeStore(process.env.SHOPIFY_STORE);
  const expectedAppClientId = String(args.appClientId || process.env.SHOPIFY_APP_CLIENT_ID || '').trim();

  if (!args.store || !targetStore.endsWith('.myshopify.com')) {
    reportFailure('missing_store', 'Pass the exact target *.myshopify.com domain with --store.', 'Confirm the project store, then rerun with --store <store>.myshopify.com.');
  } else if (configuredStore && configuredStore !== targetStore) {
    reportFailure('store_mismatch', `--store ${targetStore} differs from SHOPIFY_STORE ${configuredStore}.`, 'Correct the project .env.local or the --store argument before using this token.');
  } else if (args.siteBuild && !expectedAppClientId) {
    reportFailure('missing_app_identity', 'Site-building preflight requires the expected project App Client ID.', 'Set SHOPIFY_APP_CLIENT_ID in .env.local or pass --app-client-id. Do not use another project App.');
  } else {
    try {
      const adminConfig = getAdminConfig({ store: targetStore });
      const data = await adminGraphql(`
        query VerifyShopifyContext {
          shop { name myshopifyDomain }
          currentAppInstallation {
            app { apiKey title }
            accessScopes { handle }
          }
        }
      `, {}, adminConfig);

      const returnedStore = normalizeStore(data.shop?.myshopifyDomain);
      const app = data.currentAppInstallation?.app;
      const scopes = (data.currentAppInstallation?.accessScopes || []).map(({ handle }) => handle).sort();
      const requiredScopes = [...new Set([
        ...(args.siteBuild ? SITE_BUILD_SCOPES : []),
        ...args.requiredScopes,
      ])].sort();
      const missingScopes = requiredScopes.filter((scope) => !hasScope(scopes, scope));
      const errors = [];

      if (returnedStore !== targetStore) errors.push(`Store mismatch: API returned ${returnedStore || 'unknown'}.`);
      if (!app?.apiKey) errors.push('The token did not identify an installed App.');
      if (expectedAppClientId && app?.apiKey !== expectedAppClientId) errors.push('Installed App Client ID differs from the expected project App.');
      if (missingScopes.length) errors.push(`Missing granted scopes: ${missingScopes.join(', ')}.`);

      const nextStep = returnedStore !== targetStore
        ? 'Correct the target store or token before any write.'
        : !app?.apiKey
          ? 'Install or reauthorize the project App for this store, then rerun the check.'
        : expectedAppClientId && app?.apiKey !== expectedAppClientId
          ? 'Use the access token issued to this project App, then rerun the check.'
          : missingScopes.length
            ? 'Deploy the App scope configuration, complete store approval, then rerun the check.'
            : null;

      const result = {
        ok: errors.length === 0,
        store: targetStore,
        shopName: data.shop?.name || null,
        app: app ? { title: app.title, clientId: app.apiKey } : null,
        expectedAppClientId: expectedAppClientId || null,
        apiVersion: adminConfig.apiVersion,
        scopes,
        requiredScopes,
        missingScopes,
        errors,
        nextStep,
      };
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) process.exitCode = 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const tokenProblem = /access[_ ]token|HTTP 401|HTTP 403|invalid.api.key/i.test(message);
      reportFailure(tokenProblem ? 'authentication_failed' : 'verification_failed', message,
        tokenProblem
          ? 'Install or reauthorize the project App for this store and refresh SHOPIFY_ADMIN_API_ACCESS_TOKEN in .env.local, then rerun.'
          : 'Check the target store, API version, network connection, and App installation before retrying.');
    }
  }
}
