import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(import.meta.dirname, '..');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (req.method !== 'GET' || !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { const body = await fs.readFile(file); res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const results = [];
try {
  for (const [width, scale] of [[1440, 1], [1920, 2], [3840, 1], [1024, 2], [390, 3]]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: scale });
    const page = await context.newPage();
    const assets = [];
    page.on('response', response => { if (response.url().includes('/studio-')) assets.push(response.url().split('/').pop()); });
    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
    const expected = width > 760 && scale > 1 ? 'studio-detail@2x.webp' : 'studio-detail.webp';
    assert.deepEqual(assets, [expected], 'Only the correct density asset should load');
    const geometry = await page.locator('.hero').evaluate(hero => {
      const style = getComputedStyle(hero, '::before');
      const heroBox = hero.getBoundingClientRect();
      const content = hero.querySelector('.hero-content').getBoundingClientRect();
      return { width: parseFloat(style.width), top: heroBox.top + parseFloat(style.top), left: heroBox.right - parseFloat(style.width), contentRight: content.right, contentBottom: content.bottom };
    });
    const pixels = expected.includes('@2x') ? 1254 : 627;
    assert.ok(pixels >= geometry.width * scale, 'Source must cover physical display pixels without upscaling');
    if (width > 760) assert.ok(geometry.left >= geometry.contentRight, 'Image must not cover desktop copy');
    else assert.ok(geometry.top >= geometry.contentBottom, 'Image must stay below mobile copy');
    await page.screenshot({ path: path.join(root, 'test-results/site', `hero-${width}-${scale}x.png`) });
    results.push({ width, scale, asset: expected, renderedImageWidth: geometry.width });
    await context.close();
  }
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
