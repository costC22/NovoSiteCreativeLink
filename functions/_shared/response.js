export function requestId(context) {
  return context?.data?.requestId || crypto.randomUUID();
}

export function json(body, status = 200, context, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Request-Id': requestId(context),
      ...headers
    }
  });
}

export function getDataStore(context) {
  const store = context?.env?.BYTESTORM_DATA;
  if (!store || typeof store.get !== 'function' || typeof store.put !== 'function') {
    throw new Error('BYTESTORM_DATA binding is not configured');
  }
  return store;
}

export async function sha256Hex(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
