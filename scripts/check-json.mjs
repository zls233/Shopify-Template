import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const roots = ['theme/config', 'theme/locales', 'theme/templates'];
const files = [];

async function collect(directory) {
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await collect(path);
      else if (entry.name.endsWith('.json')) files.push(path);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

for (const root of roots) await collect(root);

for (const file of files) {
  JSON.parse(await readFile(file, 'utf8'));
  console.log(`valid JSON: ${relative('.', file)}`);
}

console.log(`checked ${files.length} JSON file(s)`);

