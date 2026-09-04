import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { FIELDS, fieldError, FILE_TYPES, MAX_FILES, MAX_FILE_BYTES, MAX_FILES_BYTES, MAX_REQUEST_BYTES } from '../../../briefing-schema.js';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const META = ['form-name', 'bot-field', 'consentimento', 'submission_id'];
const ALLOWED = new Set([...Object.keys(FIELDS), ...META, 'referencias_arquivos']);
class ValidationError extends Error {}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
    ...headers
  } });
}

function reject(message, status = 400, field) {
  const error = new ValidationError(message);
  error.status = status;
  error.field = field;
  throw error;
}

async function readForm(request) {
  const type = request.headers.get('content-type') || '';
  if (!/^multipart\/form-data\s*;/i.test(type)) reject('Formato de envio inválido.', 415);
  if (Number(request.headers.get('content-length')) > MAX_REQUEST_BYTES) reject('O envio excede o limite de tamanho.', 413);
  if (!request.body) reject('Formulário vazio.');
  // Bound the bytes actually received, including requests without Content-Length.
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        reject('O envio excede o limite de tamanho.', 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': type } }).formData(); }
  catch { reject('Não foi possível ler o formulário.'); }
}

function matchesSignature(bytes, extension) {
  if (extension === 'png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (['jpg', 'jpeg'].includes(extension)) return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (extension === 'webp') return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (extension === 'pdf') return bytes.toString('ascii', 0, 5) === '%PDF-';
  if (extension === 'zip') return bytes.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4])) || bytes.subarray(0, 4).equals(Buffer.from([80, 75, 5, 6]));
  return false;
}

async function attachments(form) {
  const files = form.getAll('referencias_arquivos');
  if (files.length > MAX_FILES) reject('Anexe no máximo 3 arquivos.');
  let total = 0;
  const result = [];
  for (const file of files) {
    if (typeof file === 'string') reject('Anexo inválido.');
    if (!file.name && !file.size) continue;
    if (!file.size || file.size > MAX_FILE_BYTES) reject('Cada arquivo pode ter até 1 MB.', 413);
    total += file.size;
    if (total > MAX_FILES_BYTES) reject('Os anexos juntos podem ter até 2 MB.', 413);
    if (file.name.length > 160 || /[\u0000-\u001f\u007f/\\]/u.test(file.name)) reject('Renomeie o arquivo usando um nome simples.');
    const extension = file.name.split('.').pop().toLowerCase();
    if (!FILE_TYPES.includes(extension)) reject('Tipo de arquivo não permitido.');
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!matchesSignature(bytes, extension)) reject('Um anexo não corresponde ao formato informado.');
    // Attachments remain private and inert: never execute, unpack or serve inline.
    result.push({ name: file.name, size: bytes.length, extension, sha256: createHash('sha256').update(bytes).digest('hex'), dataBase64: bytes.toString('base64') });
  }
  return result;
}

export function createBriefingHandler(getStore) {
  return async function briefing(request) {
    if (request.method !== 'POST') return json({ ok: false, message: 'Método não permitido.' }, 405, { Allow: 'POST' });
    if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return json({ ok: false, message: 'Origem não autorizada.' }, 403);
    try {
      const form = await readForm(request);
      for (const name of form.keys()) if (!ALLOWED.has(name)) reject('Campo não permitido.');
      for (const name of META) {
        const values = form.getAll(name);
        if (values.length > 1 || values.some(value => typeof value !== 'string' || value.length > 100)) reject('Metadados inválidos.');
      }
      if (form.get('bot-field')) reject('Envio não autorizado.', 400);
      if (form.get('form-name') !== 'briefing-bytestorm') reject('Formulário inválido.');
      if (form.get('consentimento') !== 'yes') reject('Confirme a autorização para enviar o briefing.');
      const id = form.get('submission_id') || '';
      if (!UUID.test(id)) reject('Identificador do envio inválido. Recarregue a página após guardar suas respostas.');
      const data = {};
      for (const [name, field] of Object.entries(FIELDS)) {
        const values = form.getAll(name);
        const error = fieldError(field, values);
        if (error) reject(error, 400, name);
        data[name] = field.multiple ? values.map(value => value.trim()) : (values[0] || '').trim();
      }
      const files = await attachments(form);
      const digest = createHash('sha256').update(JSON.stringify({ data, files })).digest('hex');
      const store = getStore({ name: 'briefing-submissions', consistency: 'strong' });
      const key = id.toLowerCase() + '.json';
      const record = { schemaVersion: 1, receipt: id.toLowerCase(), receivedAt: new Date().toISOString(), status: 'new', consent: true, data, files, digest };
      const write = await store.setJSON(key, record, { onlyIfNew: true });
      if (!write.modified) {
        const existing = await store.get(key, { type: 'json' });
        if (!existing || existing.digest !== digest) reject('Este envio já foi usado com outras respostas. Edite um campo e tente novamente.', 409);
      }
      return json({ ok: true, receipt: record.receipt });
    } catch (error) {
      if (error instanceof ValidationError) return json({ ok: false, message: error.message, ...(error.field ? { field: error.field } : {}) }, error.status);
      console.error('briefing_storage_error', { name: error?.name || 'Error' });
      return json({ ok: false, message: 'Não foi possível confirmar o recebimento. Tente novamente em alguns minutos.' }, 503);
    }
  };
}
