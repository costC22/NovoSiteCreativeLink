const MAX_URL_LENGTH = 2048;
const MAX_QUERY_LENGTH = 1200;
const MAX_BRIEFING_BYTES = 2 * 1024 * 1024 + 256 * 1024;
const ROUTES = new Map([
  ['/api/contact', { methods: new Set(['POST', 'OPTIONS']), body: 15_000, limit: 10, window: 60_000 }],
  ['/api/briefing', { methods: new Set(['POST']), body: MAX_BRIEFING_BYTES, limit: 6, window: 60_000 }],
  ['/api/csp-report', { methods: new Set(['POST']), body: 20_000, limit: 120, window: 60_000 }],
  ['/api/security-metrics', { methods: new Set(['GET', 'HEAD']), body: 0, limit: 60, window: 60_000 }]
]);
const BENIGN_QUERY = /^(?:utm_[a-z0-9_]+|fbclid|gclid|gbraid|wbraid|igsh|igshid|mibextid|ref|source)$/i;
const SCANNER_UA = /(?:sqlmap|nikto|nmap|masscan|acunetix|netsparker|nessus|openvas|wpscan|dirbuster|gobuster|zgrab|libwww-perl)/i;
const SQLI = /(?:\bunion\b[\s\S]{0,50}\bselect\b|\bselect\b[\s\S]{0,80}\bfrom\b|\binformation_schema\b|\bxp_cmdshell\b|\bsleep\s*\(|\bbenchmark\s*\(|\bwaitfor\s+delay\b)/i;
const XSS = /(?:<\s*script|<\/|javascript:|data:text\/html|on\w+\s*=|<\s*(?:iframe|object|embed|svg|math|form))/i;
const COMMAND = /(?:\$\(|`|\|\||&&|;\s*(?:cat|curl|wget|bash|sh|powershell|cmd|nc|python|perl|ruby)\b)/i;
const SSRF = /(?:169\.254\.169\.254|metadata\.google\.internal|localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/i;
const buckets = new Map();

function blocked(status, reason, extra = {}) {
  return new Response('Request blocked by ByteStorm security policy.', {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Request-Shield': reason,
      ...extra
    }
  });
}

function inspect(value) {
  let decoded = String(value || '').replace(/\+/g, ' ');
  try { decoded = decodeURIComponent(decoded); } catch {}
  const normalized = decoded.normalize('NFKC');
  if (SQLI.test(normalized)) return 'sql-injection-pattern';
  if (XSS.test(normalized)) return 'xss-pattern';
  if (COMMAND.test(normalized)) return 'command-injection-pattern';
  if (SSRF.test(normalized)) return 'ssrf-pattern';
  return '';
}

function enforceRateLimit(context, route) {
  const request = context.request;
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = `${new URL(request.url).pathname}:${ip}`;
  const now = Date.now();
  for (const [bucketKey, bucket] of buckets) if (now - bucket.start > bucket.window) buckets.delete(bucketKey);
  const bucket = buckets.get(key) || { start: now, count: 0, window: route.window };
  if (now - bucket.start > route.window) {
    bucket.start = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  if (bucket.count > route.limit) return blocked(429, 'rate-limited', { 'Retry-After': String(Math.ceil(route.window / 1000)) });
  return null;
}

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const route = ROUTES.get(url.pathname);
  context.data.requestId = request.headers.get('CF-Ray') || crypto.randomUUID();
  if (!route) return blocked(404, 'api-route-not-found');
  if (!route.methods.has(request.method)) return blocked(405, 'method-blocked', { Allow: [...route.methods].join(', ') });
  if (request.url.length > MAX_URL_LENGTH || url.search.length > MAX_QUERY_LENGTH) return blocked(414, 'url-too-large');
  if (Number(request.headers.get('content-length') || 0) > route.body) return blocked(413, 'payload-too-large');
  if (SCANNER_UA.test(request.headers.get('user-agent') || '')) return blocked(403, 'scanner-user-agent');
  const query = new URLSearchParams();
  for (const [key, value] of url.searchParams) if (!BENIGN_QUERY.test(key)) query.append(key, value);
  const reason = inspect(query.toString());
  if (reason) return blocked(403, reason);
  const rateError = enforceRateLimit(context, route);
  if (rateError) return rateError;
  const response = await context.next();
  response.headers.set('X-Request-Shield', 'cloudflare-api-only');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', response.headers.get('Referrer-Policy') || 'no-referrer');
  return response;
}
