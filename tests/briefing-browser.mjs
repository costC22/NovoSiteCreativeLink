import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { FIELDS } from '../briefing-schema.js';
import { createBriefingHandler } from '../netlify/functions/_shared/briefing-core.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'test-results', 'briefing');
await fs.mkdir(output, { recursive: true });
const records = new Map();
let failNext = false;
const handler = createBriefingHandler(() => ({
  async setJSON(key, value) {
    if (failNext) { failNext = false; throw new Error('Simulated storage failure'); }
    if (records.has(key)) return { modified: false };
    records.set(key, value); return { modified: true };
  },
  async get(key) { return records.get(key); }
}));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const headerFile = await fs.readFile(path.join(root, '_headers'), 'utf8');
const csp = headerFile.match(/Content-Security-Policy:\s*(.+)/)[1];
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + req.headers.host);
  if (url.pathname === '/api/briefing') {
    const parts = []; for await (const part of req) parts.push(part);
    const response = await handler(new Request(url, { method: req.method, headers: req.headers, body: Buffer.concat(parts) }));
    res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(await response.text()); return;
  }
  const name = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).slice(1);
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Content-Security-Policy': csp }); res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    const context = await browser.newContext({ viewport, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      const legacyCspWarning = /^The Content-Security-Policy directive '(frame-src|child-src)' contains the keyword 'none'/.test(msg.text());
      if (msg.type() === 'error' && !legacyCspWarning && !/Failed to load resource.*503/.test(msg.text())) errors.push(msg.text());
    });
    await page.goto(base + '/briefing.html');
    await page.waitForFunction(() => document.querySelector('[aria-current="step"]'));
    assert.equal(await page.locator('.logo img').evaluate(img => img.complete && img.naturalWidth > 0), true);
    await page.locator('#nextBtn').click();
    await page.locator('#nextBtn').click();
    assert.equal(await page.locator('#empresa').getAttribute('aria-invalid'), 'true');
    for (let step = 1; step <= 6; step++) {
      for (const [name, field] of Object.entries(FIELDS)) {
        if (field.step !== step || !field.required) continue;
        const control = page.locator(`[name="${name}"]`).first();
        if (field.type === 'radio') await page.locator(`label[for="${await control.getAttribute('id')}"]`).click();
        else if (field.options) await control.selectOption(field.options[0]);
        else await control.fill(field.type === 'email' ? 'qa@example.com' : field.type === 'tel' ? '15981724862' : name === 'objetivo_principal' ? 'Projeto QA: C# e SQL. <script>alert(1)</script>' : 'Teste de integração do briefing');
      }
      if (step === 3) {
        const checkbox = page.locator('[name="paginas"]').first();
        await page.locator(`label[for="${await checkbox.getAttribute('id')}"]`).click();
      }
      if (step === 4) {
        await page.locator('#referencias_arquivos').setInputFiles({ name: 'invalid.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') });
        assert.equal(await page.locator('#uploadError').isVisible(), true);
        await page.locator('#referencias_arquivos').setInputFiles({ name: 'referencia.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=', 'base64') });
        assert.equal(await page.locator('#fileList li').count(), 1);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow ${viewport.width} step ${step}`);
      assert.equal(await page.locator('.step-indicator[aria-current="step"]').getAttribute('data-index'), String(step));
      assert.equal(await page.locator('.step.active').evaluate(el => getComputedStyle(el).opacity), '1');
      await page.screenshot({ path: path.join(output, `${viewport.width}-step-${step + 1}.png`), fullPage: true });
      await page.locator('#nextBtn').click();
      assert.equal(await page.locator('.step.active').getAttribute('data-step'), String(step + 2));
    }
    assert.match(await page.locator('#review').innerText(), /<script>alert\(1\)<\/script>/);
    await page.locator('#nextBtn').click();
    assert.equal(await page.locator('#consent-error').isVisible(), true);
    await page.locator('#consentimento').check();
    failNext = true;
    await page.locator('#nextBtn').click();
    await page.locator('#briefingStatus').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#done').isVisible(), false);
    assert.equal(await page.locator('#empresa').inputValue(), 'Teste de integração do briefing');
    await page.locator('#nextBtn').click();
    await page.locator('#done').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(output, `${viewport.width}-success.png`), fullPage: true });
    assert.match(await page.locator('#receipt').innerText(), /Protocolo:/);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#downloadBtn').click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'briefing-bytestorm.txt');
    assert.match(await fs.readFile(await download.path(), 'utf8'), /Protocolo:/);
    await page.locator('#newBtn').click();
    assert.equal(await page.locator('.step.active').getAttribute('data-step'), '1');
    assert.equal(await page.locator('#empresa').inputValue(), '');
    await page.locator('.briefing-nav a').first().click();
    await page.waitForURL('**/index.html');
    assert.equal(await page.locator('header a[href="briefing.html"]').count(), 1);
    if (viewport.width < 769) await page.locator('.menu-button').click();
    await page.locator('header .nav-cta a').click();
    await page.waitForURL('**/briefing.html');
    await page.locator('.briefing-nav a[href="atendimento.html"]').click();
    await page.waitForURL('**/atendimento.html');
    await page.screenshot({ path: path.join(output, `${viewport.width}-atendimento.png`), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('.contact-info a[href="briefing.html"]').click();
    await page.waitForURL('**/briefing.html');
    assert.equal(errors.length, 0, errors.join('\n'));
    results.push({ width: viewport.width, workflow: 'passed', consoleErrors: errors });
    await context.close();
  }
  assert.equal(records.size, 3);
  for (const record of records.values()) assert.equal(record.files.length, 1);
  console.log(JSON.stringify({ viewports: results, stored: records.size, screenshots: output }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
