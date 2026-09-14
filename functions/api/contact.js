import { getDataStore, json, requestId } from '../_shared/response.js';

const MAX_BODY_BYTES = 15_000;
const ALLOWED_FIELDS = new Set(['name', 'email', 'company', 'service', 'message', 'source', 'subject', '_subject', '_gotcha', 'form-name']);
const ALLOWED_SERVICES = new Set(['', 'site', 'site-starter', 'site-business', 'site-premium', 'site-enterprise', 'landing-page', 'manutencao-site', 'automacao', 'integracao', 'etl', 'rpa', 'service-desk', 'consultoria', 'outro']);
const ATTACK_PATTERNS = [
  /(<\s*script|<\/|javascript:|on\w+\s*=|data:text\/html|<\s*(iframe|object|embed|form|svg|math))/i,
  /(?:\bunion\b[\s\S]{0,50}\bselect\b|\bselect\b[\s\S]{0,80}\bfrom\b|\binsert\b[\s\S]{0,60}\binto\b|\bupdate\b[\s\S]{0,60}\bset\b|\bdelete\b[\s\S]{0,60}\bfrom\b|\bdrop\b[\s\S]{0,40}\b(?:table|database)\b|\binformation_schema\b|\b(?:or|and)\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+|\bsleep\s*\(|\bbenchmark\s*\(|\bwaitfor\s+delay\b|\bxp_cmdshell\b)/i,
  /(?:\.\.\/|\.\.\\|%2e%2e|\/etc\/passwd|c:\\windows|\\windows\\system32)/i,
  /(?:\$\(|`|\|\||&&|;\s*(cat|curl|wget|bash|sh|powershell|cmd|nc|python|perl|ruby)\b)/i,
  /(?:169\.254\.169\.254|metadata\.google\.internal|localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/i
];

function clean(value, maxLength, preserveLines = false) {
  const raw = String(value || '').normalize('NFKC');
  const controls = preserveLines ? /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g;
  return raw.replace(controls, ' ').replace(/[ \t]+/g, ' ').trim().slice(0, maxLength + 1);
}

function allowedOrigins(context) {
  const configured = String(context.env.ALLOWED_CONTACT_ORIGINS || '').split(',').map((item) => item.trim()).filter(Boolean);
  return new Set([new URL(context.request.url).origin, 'https://bytestormtech.com.br', 'https://www.bytestormtech.com.br', ...configured]);
}

function cors(context) {
  const origin = context.request.headers.get('origin') || '';
  const headers = { Vary: 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Accept', 'Access-Control-Max-Age': '600' };
  if (origin && allowedOrigins(context).has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

async function payload(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return request.json();
  return Object.fromEntries((await request.formData()).entries());
}

function validate(input) {
  const keys = Object.keys(input || {});
  if (keys.length > 10 || keys.some((key) => !ALLOWED_FIELDS.has(key))) return { ok: false, message: 'Campo não permitido.' };
  const data = {
    name: clean(input.name, 80),
    email: clean(input.email, 120).toLowerCase(),
    company: clean(input.company, 120),
    service: clean(input.service, 60),
    message: clean(input.message, 1200, true),
    source: clean(input.source, 40),
    formName: clean(input['form-name'], 40),
    subject: clean(input.subject || input._subject || 'Novo contato pelo site ByteStorm Tech', 120),
    honeypot: clean(input._gotcha, 80)
  };
  if (data.honeypot) return { ok: true, bot: true, data };
  if (!data.name || !data.email || !data.message) return { ok: false, message: 'Preencha nome, e-mail e mensagem.' };
  if (data.name.length > 80 || data.email.length > 120 || data.company.length > 120 || data.message.length > 1200) return { ok: false, message: 'Um dos campos excede o limite permitido.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { ok: false, message: 'Use um e-mail válido.' };
  if (!ALLOWED_SERVICES.has(data.service)) return { ok: false, message: 'Serviço inválido.' };
  if (data.formName && data.formName !== 'bytestorm-contato') return { ok: false, message: 'Formulário inválido.' };
  for (const value of Object.values(data)) {
    if (typeof value === 'string' && ATTACK_PATTERNS.some((pattern) => pattern.test(value))) return { ok: false, message: 'Conteúdo bloqueado pela política de segurança.' };
  }
  return { ok: true, data };
}

async function storeContact(context, data) {
  const receivedAt = new Date().toISOString();
  const key = `contact/${receivedAt.slice(0, 10)}/${Date.now()}-${crypto.randomUUID()}.json`;
  const { honeypot, formName, ...record } = data;
  await getDataStore(context).put(key, JSON.stringify({ ...record, receivedAt, status: 'new', requestId: requestId(context) }));
}

async function forwardContact(context, data) {
  const endpoint = context.env.CONTACT_FORWARD_URL;
  if (!endpoint) return false;
  const form = new FormData();
  for (const name of ['name', 'email', 'company', 'service', 'message', 'source']) form.set(name, data[name] || '');
  form.set('_subject', data.subject);
  const response = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: form });
  return response.ok;
}

export async function onRequest(context) {
  const request = context.request;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(context) });
  if (request.method !== 'POST') return json({ ok: false, message: 'Método não permitido.' }, 405, context, { Allow: 'POST, OPTIONS' });
  const origin = request.headers.get('origin');
  if (origin && !allowedOrigins(context).has(origin)) return json({ ok: false, message: 'Origem não autorizada.' }, 403, context, cors(context));
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) return json({ ok: false, message: 'Mensagem muito grande.' }, 413, context, cors(context));
  let input;
  try { input = await payload(request); } catch { return json({ ok: false, message: 'Payload inválido.' }, 400, context, cors(context)); }
  const validation = validate(input);
  if (!validation.ok) return json({ ok: false, message: validation.message }, 400, context, cors(context));
  if (validation.bot) return json({ ok: true, message: 'Mensagem recebida.' }, 200, context, cors(context));
  const outcomes = await Promise.allSettled([storeContact(context, validation.data), forwardContact(context, validation.data)]);
  const stored = outcomes[0].status === 'fulfilled';
  const forwarded = outcomes[1].status === 'fulfilled' && outcomes[1].value === true;
  if (!stored && !forwarded) return json({ ok: false, message: 'Falha temporária no recebimento. Tente novamente em alguns minutos.' }, 503, context, cors(context));
  return json({ ok: true, message: 'Mensagem recebida com segurança. Retornaremos em até 24 horas úteis.' }, 200, context, {
    ...cors(context),
    'X-Security-Checks': 'origin,rate-limit,honeypot,allow-list,sqli,xss,validation,kv-storage'
  });
}
