import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const specs = [
  ['privacy-policy', 'Privacy Policy', 'CUSTOMER CARE'],
  ['return-policy', 'Return Policy', 'CUSTOMER CARE'],
  ['shipping-policy', 'Shipping Policy', 'CUSTOMER CARE'],
  ['service-policy', 'Service Policy', 'CUSTOMER CARE'],
  ['about-us', 'About Us', 'ORDER INFO'],
  ['contact-us', 'Contact Us', 'ORDER INFO'],
  ['terms-of-purchase', 'Terms Of Purchase', 'ORDER INFO'],
  ['terms-of-use', 'Terms Of Use', 'ORDER INFO'],
];

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback || '';
  const next = process.argv[index + 1];
  if (!next || next.startsWith('--')) throw new Error('Missing value for ' + name);
  return next.trim();
}
function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const brand = argument('--brand', process.env.BRAND_NAME);
const store = argument('--store', process.env.SHOPIFY_STOREFRONT_URL);
const email = argument('--email', process.env.SHOPIFY_CONTACT_EMAIL);
if (!brand || !store || !email) {
  throw new Error('Pass verified --brand, --store, and --email (or BRAND_NAME, SHOPIFY_STOREFRONT_URL, SHOPIFY_CONTACT_EMAIL).');
}
const url = new URL(store);
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
  throw new Error('The public store URL must be a verified HTTPS URL without credentials/query/fragment.');
}
if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
  throw new Error('Use an existing verified store support email.');
}
const out = resolve(argument('--out', join(root, 'output/footer-pages')));
await mkdir(out, { recursive: true });
const values = {
  BRAND_NAME: escapeHtml(brand),
  STORE_URL: escapeHtml(url.origin),
  CONTACT_EMAIL: escapeHtml(email),
};
const records = [];
for (const [handle, title, group] of specs) {
  const input = await readFile(join(root, 'content/footer-pages', handle + '.html'), 'utf8');
  const body = input.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => {
    if (!(key in values)) throw new Error('Unknown token: ' + match);
    return values[key];
  });
  if (/\{\{[^}]+\}\}/.test(body)) throw new Error('Unresolved token in ' + handle);
  await writeFile(join(out, handle + '.html'), body, 'utf8');
  records.push({ handle, title, group, file: handle + '.html', state: 'generated_draft_requires_store_policy_review' });
}
await writeFile(join(out, 'manifest.json'), JSON.stringify({
  brand, store_url: url.origin, contact_email: email, count: records.length, pages: records,
  policy_review: 'Verify store facts and applicable legal terms before publishing; no API writes were performed.',
}, null, 2) + '\n');
console.log(JSON.stringify({ output: out, pages: records.length, handles: records.map(r => r.handle) }, null, 2));
