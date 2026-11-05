#!/usr/bin/env node
// Static safety gate: find references to the source website in Shopify Theme text.
// This is not a replacement for Admin Menu, browser, redirect, and content checks.
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const values = (key) => args.flatMap((arg, i) => {
  if (arg === key && args[i + 1]) return [args[i + 1]];
  if (arg.startsWith(key + '=')) return [arg.slice(key.length + 1)];
  return [];
});
const source = values('--source')[0] || process.env.SOURCE_SITE_URL;
const themeDir = path.resolve(values('--theme')[0] || 'theme');
const report = values('--report')[0];
const allowed = new Set(values('--allow-url').map((v) => v.replace(/\/$/, '')));
if (!source) {
  console.error('SOURCE_SITE_URL is required: npm run audit:links -- --source https://source.example');
  process.exit(2);
}
let sourceHost;
try {
  sourceHost = new URL(source).hostname.toLowerCase().replace(/^www\./, '');
  if (!sourceHost || !sourceHost.includes('.')) throw new Error('hostname missing');
} catch {
  console.error('Invalid source URL. Include the https:// scheme and hostname.');
  process.exit(2);
}

const extensions = new Set(['.liquid', '.json', '.js', '.mjs', '.html', '.css']);
const files = [];
async function walk(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const filename = path.join(folder, entry.name);
    if (entry.isDirectory()) await walk(filename);
    else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) files.push(filename);
  }
}
try {
  await walk(themeDir);
} catch (error) {
  console.error('Could not read Theme directory:', error.message);
  process.exit(2);
}

const issues = [];
let permitted = 0;
const candidates = /(?:https?:)?\/\/[^\s"'<>\`)}\]]+/gi;
const isSourceHost = (host) => host === sourceHost || host.endsWith('.' + sourceHost);
for (const file of files.sort()) {
  const raw = await readFile(file, 'utf8');
  const lines = raw.replace(/\\\//g, '/').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.toLowerCase().includes(sourceHost)) continue;
    const urls = [...line.matchAll(candidates)].map((m) => m[0]);
    const bad = urls.filter((url) => {
      try {
        const canonical = url.startsWith('//') ? 'https:' + url : url;
        const u = new URL(canonical);
        if (!isSourceHost(u.hostname.toLowerCase())) return false;
        if (allowed.has(canonical.replace(/\/$/, ''))) {
          permitted++;
          return false;
        }
        return true;
      } catch {
        return true;
      }
    });
    // A literal host alongside an unrelated/allowed URL must still fail.
    const residual = urls.reduce((remaining, url) => remaining.replace(url, ''), line);
    if (bad.length || residual.toLowerCase().includes(sourceHost)) {
      issues.push({ file: path.relative(process.cwd(), file), line: i + 1, matches: bad, preview: line.trim().slice(0, 220) });
    }
  }
}
const result = {
  sourceHost, themeDir: path.relative(process.cwd(), themeDir),
  scannedFiles: files.length, approvedSourceLinks: permitted,
  sourceDomainFindings: issues.length, issues, status: issues.length ? 'failed' : 'passed_static_only',
  warning: 'Does not inspect Admin menus, redirects, runtime navigation, permissions or content correctness.'
};
if (report) {
  const output = path.resolve(report);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(result, null, 2) + '\n');
}
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;
