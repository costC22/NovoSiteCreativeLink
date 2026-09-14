import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const publicExtensions = new Set(['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.xml', '.txt']);
const specialFiles = new Set(['_headers', '_redirects', '_routes.json']);
const publicDirectories = ['.well-known', 'exclusao-de-dados', 'politica-de-privacidade'];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!publicExtensions.has(extname(entry.name).toLowerCase()) && !specialFiles.has(entry.name)) continue;
  cpSync(join(root, entry.name), join(dist, entry.name));
}
for (const directory of publicDirectories) {
  cpSync(join(root, directory), join(dist, directory), { recursive: true });
}
console.log(`Cloudflare build pronto em ${dist}`);
