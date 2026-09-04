import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'test-results', 'site');
await fs.mkdir(output, { recursive: true });
const pages = (await fs.readdir(root)).filter(name => name.endsWith('.html') && !name.startsWith('google')).concat(['politica-de-privacidade/index.html', 'exclusao-de-dados/index.html']);
const csp = (await fs.readFile(path.join(root, '_headers'), 'utf8')).match(/Content-Security-Policy:\s*(.+)/)[1];
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + req.headers.host);
  if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
  let name = decodeURIComponent(url.pathname).slice(1) || 'index.html';
  if (!path.extname(name)) name += name.endsWith('/') ? 'index.html' : '.html';
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  try {
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Content-Security-Policy': csp });
    res.end(await fs.readFile(file));
  } catch { res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const results = [];
const failures = [];
try {
  for (const width of [1920, 1440, 1024, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width > 1000 ? 900 : 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const name of pages) {
      await page.goto(base + '/' + name);
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images).map(img => { img.loading = 'eager'; return img.decode().catch(() => {}); })); });
      const check = await page.evaluate(() => {
        const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          headings: document.querySelectorAll('h1').length,
          brokenImages: Array.from(document.images).filter(img => visible(img) && !img.naturalWidth).map(img => img.getAttribute('src')),
          links: Array.from(document.querySelectorAll('a[href]')).map(a => a.href),
          clippedText: Array.from(document.querySelectorAll('h1,h2,h3,h4,p,.cta-button,.home-price-action')).filter(el => visible(el) && el.scrollWidth > el.clientWidth + 3).map(el => el.textContent.trim().slice(0,70))
        };
      });
      if (check.overflow || check.brokenImages.length || check.clippedText.length || !check.headings) failures.push({ width, name, ...check, links: undefined });
      if (width === 1440) {
        for (const href of check.links) {
          const url = new URL(href);
          if (url.origin !== base || url.pathname.startsWith('/api/')) continue;
          let target = decodeURIComponent(url.pathname).slice(1) || 'index.html';
          if (!path.extname(target)) target += target.endsWith('/') ? 'index.html' : '.html';
          try { await fs.access(path.join(root, target)); } catch { failures.push({ name, brokenLink: target }); }
          if (url.hash && target === name) assert.ok(await page.locator('[id="' + decodeURIComponent(url.hash.slice(1)) + '"]').count(), 'Missing fragment ' + href);
        }
      }
      if ([1440, 390].includes(width) || (width === 1920 && name === 'index.html')) await page.screenshot({ path: path.join(output, `${width}-${name.replaceAll('/', '-')}.png`), fullPage: true });
      if (width <= 1100 && await page.locator('.menu-button').count()) {
        await page.locator('.menu-button').click();
        assert.equal(await page.locator('header nav').getAttribute('aria-hidden'), 'false');
        assert.equal(await page.locator('header nav').evaluate(el => getComputedStyle(el).filter), 'none');
        if (['index.html', 'produtos.html'].includes(name) && width === 390) await page.screenshot({ path: path.join(output, `${width}-menu-${name}.png`) });
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.menu-button').getAttribute('aria-expanded'), 'false');
      }
      results.push({ width, page: name, overflow: check.overflow });
    }
    assert.deepEqual(errors, []);

    await page.goto(base + '/atendimento?plan=business');
    assert.equal(await page.locator('#service').inputValue(), 'site-business');
    assert.equal(await page.locator('header a[href="atendimento.html"]').getAttribute('aria-current'), 'page');
    let requests = 0;
    let mode = 'failure';
    let release;
    await page.route('**/api/contact', async route => {
      requests++;
      if (mode === 'offline') { await route.abort(); return; }
      if (mode === 'pending') await new Promise(resolve => { release = resolve; });
      await route.fulfill({ status: mode === 'failure' ? 503 : 200, contentType: 'application/json', body: JSON.stringify(mode === 'invalid' ? {} : { ok: mode !== 'failure', message: mode === 'failure' ? 'Falha temporária. Tente novamente.' : 'Recebido.' }) });
    });
    const submit = page.locator('form[data-secure-contact] button[type="submit"]');
    await submit.click();
    assert.equal(await page.locator('#name').getAttribute('aria-invalid'), 'true');
    assert.equal(requests, 0);
    await page.locator('#name').fill('Teste local');
    await page.locator('#email').fill('invalido');
    await submit.click();
    assert.equal(await page.locator('#email').getAttribute('aria-invalid'), 'true');
    await page.locator('#email').fill('qa@example.com');
    await page.locator('#message').fill('Teste local, sem envio para produção.');
    for (mode of ['failure', 'invalid', 'offline']) {
      await submit.click();
      await page.locator('.form-status.is-error').waitFor();
      assert.equal(await page.locator('#name').inputValue(), 'Teste local');
      assert.equal(await page.locator('.form-status.is-success').count(), 0);
    }
    mode = 'pending';
    await submit.click();
    await page.locator('form[aria-busy="true"]').waitFor();
    const before = requests;
    await page.locator('form[data-secure-contact]').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(requests, before);
    assert.equal(await submit.isDisabled(), true);
    while (!release) await new Promise(resolve => setTimeout(resolve, 10));
    mode = 'success'; release();
    await page.locator('.form-status.is-success').waitFor();
    assert.equal(await page.locator('#name').inputValue(), '');
    assert.equal(await submit.isEnabled(), true);
    await page.screenshot({ path: path.join(output, `${width}-contact-success.png`), fullPage: true });
    await context.close();
  }
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify({ results, failures }, null, 2));
  assert.deepEqual(failures, [], JSON.stringify(failures, null, 2));
  console.log(JSON.stringify({ pages: pages.length, viewports: 5, checks: results.length, contact: 'validation, failure, invalid response, offline, duplicate prevention, success: passed', screenshots: output }));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
