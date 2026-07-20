const MAX_REPORT_BYTES = 20_000;

function noStoreHeaders() {
  return {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
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

function compactReport(payload) {
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

export default async function cspReport(req) {
  if (req.method !== 'POST') {
    return new Response(null, { status: 405, headers: { ...noStoreHeaders(), Allow: 'POST' } });
  }

  const length = Number(req.headers.get('content-length') || 0);
  if (length > MAX_REPORT_BYTES) {
    return new Response(null, { status: 413, headers: noStoreHeaders() });
  }

  try {
    const text = await req.text();
    if (!text) return new Response(null, { status: 204, headers: noStoreHeaders() });
    const payload = JSON.parse(text);
    console.warn('csp_violation', compactReport(payload));
  } catch {
    console.warn('csp_violation_parse_failed');
  }

  return new Response(null, { status: 204, headers: noStoreHeaders() });
}

export const config = {
  path: '/api/csp-report',
  method: ['POST']
};
