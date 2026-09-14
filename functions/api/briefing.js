import { FIELDS, fieldError, FILE_TYPES, MAX_FILES, MAX_FILE_BYTES, MAX_FILES_BYTES, MAX_REQUEST_BYTES } from '../../briefing-schema.js';
import { getDataStore, json, sha256Hex } from '../_shared/response.js';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const META = ['form-name', 'bot-field', 'consentimento', 'submission_id'];
const ALLOWED = new Set([...Object.keys(FIELDS), ...META, 'referencias_arquivos']);
class ValidationError extends Error {}

function reject(message, status = 400, field) {
  const error = new ValidationError(message);
  error.status = status;
  error.field = field;
  throw error;
}

async function readForm(request) {
  const type = request.headers.get('content-type') || '';
  if (!/^multipart\/form-data\s*;/i.test(type)) reject('Formato de envio inválido.', 415);
  if (Number(request.headers.get('content-length') || 0) > MAX_REQUEST_BYTES) reject('O envio excede o limite de tamanho.', 413);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length) reject('Formulário vazio.');
  if (bytes.byteLength > MAX_REQUEST_BYTES) reject('O envio excede o limite de tamanho.', 413);
  try {
    return await new Response(bytes, { headers: { 'Content-Type': type } }).formData();
  } catch {
    reject('Não foi possível ler o formulário.');
  }
}

function prefix(bytes, expected) {
  return expected.every((value, index) => bytes[index] === value);
}

function ascii(bytes, start, end) {
  return new TextDecoder('ascii').decode(bytes.slice(start, end));
}

function matchesSignature(bytes, extension) {
  if (extension === 'png') return prefix(bytes, [137, 80, 78, 71, 13, 10, 26, 10]);
  if (extension === 'jpg' || extension === 'jpeg') return prefix(bytes, [255, 216, 255]);
  if (extension === 'webp') return ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP';
  if (extension === 'pdf') return ascii(bytes, 0, 5) === '%PDF-';
  if (extension === 'zip') return prefix(bytes, [80, 75, 3, 4]) || prefix(bytes, [80, 75, 5, 6]);
  return false;
}

function base64(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
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
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesSignature(bytes, extension)) reject('Um anexo não corresponde ao formato informado.');
    result.push({
      name: file.name,
      size: bytes.length,
      extension,
      sha256: await sha256Hex(bytes),
      dataBase64: base64(bytes)
    });
  }
  return result;
}

export async function onRequest(context) {
  const request = context.request;
  if (request.method !== 'POST') return json({ ok: false, message: 'Método não permitido.' }, 405, context, { Allow: 'POST' });
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ ok: false, message: 'Origem não autorizada.' }, 403, context);
  }
  try {
    const form = await readForm(request);
    for (const name of form.keys()) if (!ALLOWED.has(name)) reject('Campo não permitido.');
    for (const name of META) {
      const values = form.getAll(name);
      if (values.length > 1 || values.some((value) => typeof value !== 'string' || value.length > 100)) reject('Metadados inválidos.');
    }
    if (form.get('bot-field')) reject('Envio não autorizado.');
    if (form.get('form-name') !== 'briefing-bytestorm') reject('Formulário inválido.');
    if (form.get('consentimento') !== 'yes') reject('Confirme a autorização para enviar o briefing.');
    const id = form.get('submission_id') || '';
    if (!UUID.test(id)) reject('Identificador do envio inválido. Recarregue a página após guardar suas respostas.');

    const data = {};
    for (const [name, field] of Object.entries(FIELDS)) {
      const values = form.getAll(name);
      const error = fieldError(field, values);
      if (error) reject(error, 400, name);
      data[name] = field.multiple ? values.map((value) => value.trim()) : (values[0] || '').trim();
    }

    const files = await attachments(form);
    const digest = await sha256Hex(JSON.stringify({ data, files }));
    const store = getDataStore(context);
    const key = `briefing/${id.toLowerCase()}.json`;
    const existing = await store.get(key, 'json');
    if (existing && existing.digest !== digest) {
      reject('Este envio já foi usado com outras respostas. Edite um campo e tente novamente.', 409);
    }
    const record = {
      schemaVersion: 1,
      receipt: id.toLowerCase(),
      receivedAt: existing?.receivedAt || new Date().toISOString(),
      status: 'new',
      consent: true,
      data,
      files,
      digest
    };
    if (!existing) await store.put(key, JSON.stringify(record));
    return json({ ok: true, receipt: record.receipt }, 200, context);
  } catch (error) {
    if (error instanceof ValidationError) {
      return json({ ok: false, message: error.message, ...(error.field ? { field: error.field } : {}) }, error.status, context);
    }
    console.error('briefing_storage_error', { name: error?.name || 'Error' });
    return json({ ok: false, message: 'Não foi possível confirmar o recebimento. Tente novamente em alguns minutos.' }, 503, context);
  }
}
