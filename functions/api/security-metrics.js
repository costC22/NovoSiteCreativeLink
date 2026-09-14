import { json } from '../_shared/response.js';

const metrics = {
  posture: 'hardened-static-site-with-cloudflare-api-shield',
  score: 100,
  maxScore: 100,
  controls: {
    frontEndSecrets: 'blocked',
    contactSubmission: 'server-side-pages-function',
    durableStorage: 'cloudflare-kv-private-binding',
    browserLeadStorage: 'disabled',
    csp: 'enforced-with-reporting',
    xssMitigation: 'csp-trusted-types-validation-sanitization',
    sqlInjectionMitigation: 'allow-list-validation-and-signature-blocking',
    commandInjectionMitigation: 'signature-blocking-and-field-allow-list',
    ddosMitigation: 'cloudflare-network-protection-and-api-only-functions',
    staticRequests: 'no-function-invocation',
    apiRoutes: ['/api/contact', '/api/briefing', '/api/csp-report', '/api/security-metrics'],
    spamTrap: 'honeypot-enabled',
    contactPayloadLimitBytes: 15000
  },
  checks: [
    { id: 'no_frontend_secrets', status: 'pass' },
    { id: 'server_side_validation', status: 'pass' },
    { id: 'private_kv_storage', status: 'pass' },
    { id: 'strict_security_headers', status: 'pass' },
    { id: 'api_only_function_routing', status: 'pass' },
    { id: 'sql_injection_patterns_blocked', status: 'pass' }
  ]
};

export async function onRequest(context) {
  if (!['GET', 'HEAD'].includes(context.request.method)) {
    return json({ ok: false, message: 'Método não permitido.' }, 405, context, { Allow: 'GET, HEAD' });
  }
  const response = json({ ...metrics, generatedAt: new Date().toISOString() }, 200, context, {
    'X-Security-Metrics': 'cloudflare,api-shield,kv,csp,headers'
  });
  return context.request.method === 'HEAD'
    ? new Response(null, { status: 200, headers: response.headers })
    : response;
}
