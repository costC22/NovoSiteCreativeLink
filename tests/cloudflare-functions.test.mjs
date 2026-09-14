import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { FIELDS } from '../briefing-schema.js';
import { onRequest as contact } from '../functions/api/contact.js';
import { onRequest as briefing } from '../functions/api/briefing.js';
import { onRequest as middleware } from '../functions/api/_middleware.js';
import { onRequest as securityMetrics } from '../functions/api/security-metrics.js';

const origin = 'https://bytestormtech.pages.dev';

class FakeKV {
  constructor() { this.records = new Map(); }
  async get(key, type) {
    const value = this.records.get(key);
    if (value === undefined) return null;
    return type === 'json' ? JSON.parse(value) : value;
  }
  async put(key, value) { this.records.set(key, value); }
}

function context(request, store = new FakeKV(), next) {
  return {
    request,
    env: { BYTESTORM_DATA: store },
    data: {},
    next: next || (async () => new Response('OK'))
  };
}

function validBriefing() {
  const form = new FormData();
  form.set('form-name', 'briefing-bytestorm');
  form.set('consentimento', 'yes');
  form.set('submission_id', randomUUID());
  for (const [name, field] of Object.entries(FIELDS)) {
    if (!field.required) continue;
    form.set(name, field.options?.[0] || (field.type === 'email' ? 'qa@example.com' : field.type === 'tel' ? '15981724862' : 'Projeto de teste'));
  }
  return form;
}

test('Cloudflare contact stores a validated lead only on the server', async () => {
  const store = new FakeKV();
  const form = new FormData();
  form.set('form-name', 'bytestorm-contato');
  form.set('name', 'Cliente Teste');
  form.set('email', 'cliente@example.com');
  form.set('service', 'site');
  form.set('message', 'Preciso de um site institucional.');
  const request = new Request(origin + '/api/contact', { method: 'POST', headers: { origin }, body: form });
  const response = await contact(context(request, store));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(store.records.size, 1);
  assert.match([...store.records.keys()][0], /^contact\//);
});

test('Cloudflare contact rejects injection payloads before storage', async () => {
  const store = new FakeKV();
  const request = new Request(origin + '/api/contact', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Teste', email: 'teste@example.com', service: 'site', message: 'UNION SELECT password FROM users' })
  });
  const response = await contact(context(request, store));
  assert.equal(response.status, 400);
  assert.equal(store.records.size, 0);
});

test('Cloudflare briefing stores an idempotent private record', async () => {
  const store = new FakeKV();
  const form = validBriefing();
  const id = form.get('submission_id');
  const makeRequest = () => new Request(origin + '/api/briefing', { method: 'POST', headers: { origin }, body: form });
  const first = await briefing(context(makeRequest(), store));
  assert.equal(first.status, 200);
  assert.equal((await first.json()).receipt, id);
  const second = await briefing(context(makeRequest(), store));
  assert.equal(second.status, 200);
  assert.equal(store.records.size, 1);
  assert.equal([...store.records.keys()][0], `briefing/${id}.json`);
});

test('API middleware blocks suspicious query strings and leaves valid calls available', async () => {
  const malicious = new Request(origin + '/api/security-metrics?q=UNION%20SELECT%20password%20FROM%20users', { headers: { 'user-agent': 'Mozilla/5.0' } });
  assert.equal((await middleware(context(malicious))).status, 403);
  const valid = new Request(origin + '/api/security-metrics', { headers: { 'user-agent': 'Mozilla/5.0' } });
  const response = await middleware(context(valid, new FakeKV(), async () => new Response('OK')));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Request-Shield'), 'cloudflare-api-only');
});

test('security metrics describe the Cloudflare API-only posture', async () => {
  const request = new Request(origin + '/api/security-metrics');
  const response = await securityMetrics(context(request));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.controls.staticRequests, 'no-function-invocation');
  assert.equal(body.controls.durableStorage, 'cloudflare-kv-private-binding');
});
