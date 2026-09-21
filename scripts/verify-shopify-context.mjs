import { adminGraphql, getAdminConfig, normalizeStore } from './lib/shopify-admin.mjs';

function parseArgs(argv) {
  const args = { requiredScopes: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--store') args.store = argv[++index];
    else if (argument === '--require-scope') args.requiredScopes.push(argv[++index]);
    else if (argument === '--json') args.json = true;
    else if (argument === '--help') args.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log('Usage: node scripts/verify-shopify-context.mjs --store <store.myshopify.com> [--require-scope <scope>]');
  process.exit(0);
}

const adminConfig = getAdminConfig({ store: args.store });
const data = await adminGraphql(`
  query VerifyShopifyContext {
    shop {
      name
      myshopifyDomain
    }
    currentAppInstallation {
      accessScopes {
        handle
      }
    }
  }
`, {}, adminConfig);

const returnedStore = normalizeStore(data.shop?.myshopifyDomain);
if (returnedStore !== adminConfig.store) {
  throw new Error(`Store mismatch: expected ${adminConfig.store}, API returned ${returnedStore || 'unknown'}.`);
}

const scopes = (data.currentAppInstallation?.accessScopes || [])
  .map(({ handle }) => handle)
  .sort();
const requiredScopes = [...new Set(args.requiredScopes)].sort();
const missingScopes = requiredScopes.filter((scope) => !scopes.includes(scope));
const result = {
  ok: missingScopes.length === 0,
  store: adminConfig.store,
  shopName: data.shop?.name || null,
  apiVersion: adminConfig.apiVersion,
  scopes,
  requiredScopes,
  missingScopes,
};

console.log(JSON.stringify(result, null, 2));
if (missingScopes.length) process.exitCode = 1;

