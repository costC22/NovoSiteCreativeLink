const MAX_BODY_BYTES = 15_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const ALLOWED_SERVICES = new Set([
  '',
  'site',
  'landing-page',
  'manutencao-site',
  'automacao',
  'integracao',
  'etl',
  'rpa',
  'service-desk',
  'consultoria',
  'outro'
]);

const buckets = globalThis.__byteStormContactRateBuckets || new Map();
globalThis.__byteStormContactRateBuckets = buckets;

function env(name) {
  return globalThis.Netlify?.env?.get?.(name) || '';
}

function requestId(context) {
  return context?.requestId || crypto.randomUUID();
}

function jsonResponse(body, status, context, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Request-Id': requestId(context),
      'X-Security-Checks': 'origin,rate-limit,honeypot,validation,sanitization,server-forward',
      ...extraHeaders
    }
  });
}

function allowedOrigins(req) {
  const currentOrigin = new URL(req.url).origin;
  const configured = env('ALLOWED_CONTACT_ORIGINS')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return new Set([currentOrigin, 'https://bytestormtech.com.br', ...configured]);
}

function corsHeaders(req) {
  const origin = req.headers.get('origin') || '';
  const headers = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '600'
  };
  if (origin && allowedOrigins(req).has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function enforceOrigin(req, context) {
  const origin = req.headers.get('origin');
  if (!origin) return null;
  if (allowedOrigins(req).has(origin)) return null;
  return jsonResponse({ ok: false, message: 'Origem nao autorizada.' }, 403, context, corsHeaders(req));
}

function enforceBodySize(req, context) {
  const length = Number(req.headers.get('content-length') || 0);
  if (length > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, message: 'Mensagem muito grande.' }, 413, context, corsHeaders(req));
  }
  return null;
}

function clientKey(req, context) {
  const forwardedFor = req.headers.get('x-forwarded-for') || '';
  const ip = context?.ip || forwardedFor.split(',')[0].trim() || 'unknown-ip';
  const ua = req.headers.get('user-agent') || 'unknown-ua';
  return `${ip}:${ua.slice(0, 80)}`;
}

function enforceRateLimit(req, context) {
  const now = Date.now();
  const key = clientKey(req, context);
  for (const [bucketKey, bucket] of buckets.entries()) {
    if (now - bucket.start > RATE_LIMIT_WINDOW_MS) buckets.delete(bucketKey);
  }
  const bucket = buckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start > RATE_LIMIT_WINDOW_MS) {
    bucket.start = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  if (bucket.count > RATE_LIMIT_MAX) {
    return jsonResponse(
      { ok: false, message: 'Muitas tentativas. Aguarde alguns minutos.' },
      429,
      context,
      { ...corsHeaders(req), 'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) }
    );
  }
  return null;
}

async function readPayload(req) {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await req.json();
  }
  const formData = await req.formData();
  return Object.fromEntries(formData.entries());
}

function cleanText(value, maxLength, preserveLines = false) {
  const raw = String(value || '').normalize('NFKC');
  const controls = preserveLines ? /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g;
  const cleaned = raw.replace(controls, ' ').replace(/[ \t]+/g, ' ').trim();
  return cleaned.slice(0, maxLength + 1);
}

function validate(payload) {
  const data = {
    name: cleanText(payload.name, 80),
    email: cleanText(payload.email, 120).toLowerCase(),
    company: cleanText(payload.company, 120),
    service: cleanText(payload.service, 60),
    message: cleanText(payload.message, 1200, true),
    source: cleanText(payload.source, 40),
    subject: cleanText(payload.subject || payload._subject || 'Novo contato pelo site ByteStorm Tech', 120),
    honeypot: cleanText(payload._gotcha, 80)
  };

  if (data.honeypot) {
    return { ok: true, bot: true, data };
  }

  const suspiciousPattern = /(<\s*script|<\/|javascript:|on\w+\s*=|data:text\/html|<\s*(iframe|object|embed|form|svg|math))/i;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.name || !data.email || !data.message) {
    return { ok: false, message: 'Preencha nome, e-mail e mensagem.' };
  }
  if (data.name.length > 80 || data.email.length > 120 || data.company.length > 120 || data.message.length > 1200) {
    return { ok: false, message: 'Um dos campos excede o limite permitido.' };
  }
  if (!emailPattern.test(data.email)) {
    return { ok: false, message: 'Use um e-mail valido.' };
  }
  if (!ALLOWED_SERVICES.has(data.service)) {
    return { ok: false, message: 'Servico invalido.' };
  }
  for (const value of [data.name, data.email, data.company, data.message]) {
    if (suspiciousPattern.test(value)) {
      return { ok: false, message: 'Conteudo bloqueado pela politica de seguranca.' };
    }
  }
  return { ok: true, data };
}

async function forwardContact(data) {
  const endpoint = env('CONTACT_FORWARD_URL');
  if (!endpoint) {
    return { ok: false, status: 503, message: 'Canal seguro ainda nao configurado no servidor.' };
  }

  const form = new FormData();
  form.set('name', data.name);
  form.set('email', data.email);
  form.set('company', data.company);
  form.set('service', data.service);
  form.set('message', data.message);
  form.set('source', data.source || 'site');
  form.set('_subject', data.subject);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: form,
      signal: controller.signal
    });
    if (!response.ok) {
      console.warn('contact_forward_failed', { status: response.status });
      return { ok: false, status: 502, message: 'Falha temporaria no canal seguro.' };
    }
    return { ok: true };
  } catch (error) {
    console.warn('contact_forward_error', { name: error.name });
    return { ok: false, status: 502, message: 'Falha temporaria no canal seguro.' };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function contact(req, context) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Metodo nao permitido.' }, 405, context, { Allow: 'POST, OPTIONS' });
  }

  const originError = enforceOrigin(req, context);
  if (originError) return originError;

  const sizeError = enforceBodySize(req, context);
  if (sizeError) return sizeError;

  const rateError = enforceRateLimit(req, context);
  if (rateError) return rateError;

  let payload;
  try {
    payload = await readPayload(req);
  } catch {
    return jsonResponse({ ok: false, message: 'Payload invalido.' }, 400, context, corsHeaders(req));
  }

  const validation = validate(payload);
  if (!validation.ok) {
    return jsonResponse({ ok: false, message: validation.message }, 400, context, corsHeaders(req));
  }
  if (validation.bot) {
    return jsonResponse({ ok: true, message: 'Mensagem recebida.' }, 200, context, corsHeaders(req));
  }

  const forwarded = await forwardContact(validation.data);
  if (!forwarded.ok) {
    return jsonResponse({ ok: false, message: forwarded.message }, forwarded.status, context, corsHeaders(req));
  }

  return jsonResponse({ ok: true, message: 'Mensagem enviada com seguranca.' }, 200, context, corsHeaders(req));
}

export const config = {
  path: '/api/contact',
  method: ['POST', 'OPTIONS']
};
