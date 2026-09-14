const MAX_REPORT_BYTES = 20_000;

function headers() {
  return {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow'
  };
}

function stripUrl(value) {
  if (!value || value === 'inline' || value === 'eval') return value || '';
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return String(value).slice(0, 180);
  }
}

function compact(payload) {
  const report = payload['csp-report'] || payload.body || payload;
  return {
    documentUri: stripUrl(report['document-uri'] || report.documentURL),
    blockedUri: stripUrl(report['blocked-uri'] || report.blockedURL),
    effectiveDirective: String(report['effective-directive'] || report.effectiveDirective || '').slice(0, 80),
    violatedDirective: String(report['violated-directive'] || report.violatedDirective || '').slice(0, 120),
    disposition: String(report.disposition || '').slice(0, 40),
    statusCode: Number(report['status-code'] || report.statusCode || 0)
  };
}

export async function onRequest(context) {
  const request = context.request;
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { ...headers(), Allow: 'POST' } });
  if (Number(request.headers.get('content-length') || 0) > MAX_REPORT_BYTES) return new Response(null, { status: 413, headers: headers() });
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_REPORT_BYTES) return new Response(null, { status: 413, headers: headers() });
    if (text) console.warn('csp_violation', compact(JSON.parse(text)));
  } catch {
    console.warn('csp_violation_parse_failed');
  }
  return new Response(null, { status: 204, headers: headers() });
}
