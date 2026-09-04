import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { FIELDS, MAX_REQUEST_BYTES } from '../briefing-schema.js';
import { createBriefingHandler } from '../netlify/functions/_shared/briefing-core.mjs';
import shield from '../netlify/edge-functions/request-shield.js';

const origin = 'https://bytestormtech.com.br';
function validForm() {
  const form = new FormData();
  form.set('form-name', 'briefing-bytestorm');
  form.set('consentimento', 'yes');
  form.set('submission_id', randomUUID());
  for (const [name, field] of Object.entries(FIELDS)) if (field.required) form.set(name, field.options?.[0] || (field.type === 'email' ? 'qa@example.com' : field.type === 'tel' ? '15981724862' : 'Projeto de teste'));
  return form;
}
function setup() {
  const records = new Map();
  const handler = createBriefingHandler(() => ({
    async setJSON(key, value, options) {
      assert.equal(options.onlyIfNew, true);
      if (records.has(key)) return { modified: false };
      records.set(key, value);
      return { modified: true };
    },
    async get(key) { return records.get(key); }
  }));
  return { records, handler };
}
function request(body, headers = {}) { return new Request(origin + '/api/briefing', { method: 'POST', headers: { origin, ...headers }, body }); }

test('stores valid briefing privately with a receipt, multichoice and literal project text', async () => {
  const { handler, records } = setup();
  const form = validForm();
  form.append('paginas', 'Home'); form.append('paginas', 'Blog');
  form.set('infra_existente', 'C# + SQL Server');
  form.set('objetivo_principal', '<script>alert(1)</script> is literal text, never HTML');
  const response = await handler(request(form));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.receipt, form.get('submission_id'));
  assert.equal(result.data, undefined);
  const record = [...records.values()][0];
  assert.deepEqual(record.data.paginas, ['Home', 'Blog']);
  assert.equal(record.data.infra_existente, 'C# + SQL Server');
});

test('retry is idempotent; changing content with the same id is rejected', async () => {
  const { handler, records } = setup();
  const form = validForm();
  assert.equal((await handler(request(form))).status, 200);
  assert.equal((await handler(request(form))).status, 200);
  assert.equal(records.size, 1);
  form.set('empresa', 'Outra empresa');
  assert.equal((await handler(request(form))).status, 409);
  assert.equal(records.size, 1);
});

const invalidCases = [
  ['required field', form => form.delete('empresa')],
  ['email', form => form.set('email', 'invalid')],
  ['phone', form => form.set('telefone', '123')],
  ['optional URL', form => form.set('site_atual', 'javascript:alert(1)')],
  ['URL credentials', form => form.set('site_atual', 'https://user:pass@example.com')],
  ['date', form => form.set('prazo_desejado', '2026-02-31')],
  ['unknown field', form => form.set('admin', 'true')],
  ['duplicate field', form => form.append('empresa', 'another')],
  ['duplicate checkbox', form => { form.append('paginas', 'Home'); form.append('paginas', 'Home'); }],
  ['invalid option', form => form.set('tipo_projeto', 'arbitrary')],
  ['consent', form => form.delete('consentimento')],
  ['honeypot', form => form.set('bot-field', 'bot')],
  ['field limit', form => form.set('empresa', 'x'.repeat(201))],
  ['invalid id', form => form.set('submission_id', '../../file')],
  ['invalid signature', form => form.append('referencias_arquivos', new Blob(['not a PNG']), 'fake.png')],
  ['disallowed file', form => form.append('referencias_arquivos', new Blob(['MZ']), 'file.exe')],
  ['filename path', form => form.append('referencias_arquivos', new Blob(['%PDF-1.7\n']), '../file.pdf')],
  ['too many files', form => { for (let i = 0; i < 4; i++) form.append('referencias_arquivos', new Blob(['%PDF-1.7\n']), i + '.pdf'); }]
];
for (const [label, mutate] of invalidCases) test('rejects ' + label + ' without storage', async () => {
  const { handler, records } = setup();
  const form = validForm(); mutate(form);
  assert.equal((await handler(request(form))).status, 400);
  assert.equal(records.size, 0);
});

test('accepts all supported file signatures as inert private bytes', async () => {
  const formats = [['a.png', [137,80,78,71,13,10,26,10]], ['a.jpg', [255,216,255,0]], ['a.webp', Buffer.from('RIFF0000WEBP')], ['a.pdf', Buffer.from('%PDF-1.7\n')], ['a.zip', [80,75,5,6]]];
  for (const [name, bytes] of formats) {
    const { handler, records } = setup();
    const form = validForm();
    form.append('referencias_arquivos', new Blob([new Uint8Array(bytes)]), name);
    assert.equal((await handler(request(form))).status, 200, name);
    const file = [...records.values()][0].files[0];
    assert.equal(file.name, name);
    assert.equal(Buffer.from(file.dataBase64, 'base64').length, bytes.length);
  }
});

test('rejects oversized file and aggregate attachments', async () => {
  const { handler, records } = setup();
  const form = validForm();
  form.append('referencias_arquivos', new Blob([new Uint8Array(1024 * 1024 + 1)]), 'big.png');
  assert.equal((await handler(request(form))).status, 413);
  const total = validForm();
  for (let i = 0; i < 3; i++) total.append('referencias_arquivos', new Blob(['%PDF-', new Uint8Array(750000)]), i + '.pdf');
  assert.equal((await handler(request(total))).status, 413);
  assert.equal(records.size, 0);
});

test('limits body bytes without trusting Content-Length', async () => {
  const { handler } = setup();
  const body = new Uint8Array(MAX_REQUEST_BYTES + 1);
  for (const headers of [{}, { 'content-length': '1' }]) {
    const response = await handler(request(body, { 'content-type': 'multipart/form-data; boundary=test', ...headers }));
    assert.equal(response.status, 413);
  }
});

test('rejects nonmultipart, malformed form, missing origin, foreign origin and GET', async () => {
  const { handler } = setup();
  assert.equal((await handler(request('{}', { 'content-type': 'application/json' }))).status, 415);
  assert.equal((await handler(request('broken', { 'content-type': 'multipart/form-data; boundary=test' }))).status, 400);
  assert.equal((await handler(request(validForm(), { origin: 'https://other.example' }))).status, 403);
  assert.equal((await handler(request(validForm(), { origin: '' }))).status, 403);
  assert.equal((await handler(new Request(origin + '/api/briefing'))).status, 405);
});

test('storage failure never becomes a successful submission or leaks infrastructure errors', async () => {
  const handler = createBriefingHandler(() => { const error = new Error('private storage credentials'); error.status = 401; throw error; });
  const response = await handler(request(validForm()));
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes('credentials'), false);
});

test('shield accepts briefing uploads but retains the smaller contact limit', async () => {
  for (const [path, size, expected] of [['briefing', 100000, 200], ['briefing', MAX_REQUEST_BYTES + 1, 413], ['contact', 100000, 413], ['unknown', 10, 405]]) {
    const req = new Request(origin + '/api/' + path, { method: 'POST', headers: { 'content-length': String(size), 'user-agent': 'Mozilla/5.0' } });
    const response = await shield(req, { next: async () => new Response('OK') });
    assert.equal(response.status, expected);
  }
});
