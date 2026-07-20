const MAX_URL_LENGTH = 2048;
const MAX_QUERY_LENGTH = 1200;
const MAX_EDGE_CONTENT_LENGTH = 20_000;
const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'POST', 'OPTIONS']);
const POST_ALLOWED_PATHS = new Set(['/api/contact', '/api/csp-report']);

const SUSPICIOUS_USER_AGENT = /(?:sqlmap|nikto|nmap|masscan|acunetix|netsparker|nessus|openvas|wpscan|dirbuster|gobuster|zgrab|libwww-perl|python-requests|java\/|curl\/|wget\/)/i;
const SUSPICIOUS_PATH = /(?:\.\.|%2e%2e|\\|\/\.env|\/wp-admin|\/wp-login|\/xmlrpc\.php|\/phpmyadmin|\/adminer|\/vendor\/|\/actuator|\/server-status|\/cgi-bin|\.(?:php|asp|aspx|jsp|cgi)(?:$|[?#]))/i;
const SQLI_PATTERN = /(?:\bunion\b[\s\S]{0,50}\bselect\b|\bselect\b[\s\S]{0,80}\bfrom\b|\binsert\b[\s\S]{0,60}\binto\b|\bupdate\b[\s\S]{0,60}\bset\b|\bdelete\b[\s\S]{0,60}\bfrom\b|\bdrop\b[\s\S]{0,40}\b(?:table|database)\b|\binformation_schema\b|\b(?:or|and)\b\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+|--|#|\/\*|\*\/|\bsleep\s*\(|\bbenchmark\s*\(|\bwaitfor\s+delay\b|\bload_file\s*\(|\boutfile\b|\bxp_cmdshell\b|0x[0-9a-f]{6,})/i;
const XSS_PATTERN = /(?:<\s*script|<\/|javascript:|data:text\/html|on\w+\s*=|<\s*(?:iframe|object|embed|svg|math|form))/i;
const COMMAND_PATTERN = /(?:\$\(|`|\|\||&&|;\s*(?:cat|curl|wget|bash|sh|powershell|cmd|nc|python|perl|ruby)\b)/i;
const SSRF_PATTERN = /(?:169\.254\.169\.254|metadata\.google\.internal|localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/i;

function securityHeaders(reason = 'passed') {
  return {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Request-Shield': reason
  };
}

function block(status, reason) {
  return new Response('Request blocked by ByteStorm security policy.', {
    status,
    headers: securityHeaders(reason)
  });
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function inspect(value) {
  const normalized = safeDecode(String(value || '').normalize('NFKC'));
  if (SQLI_PATTERN.test(normalized)) return 'sql-injection-pattern';
  if (XSS_PATTERN.test(normalized)) return 'xss-pattern';
  if (COMMAND_PATTERN.test(normalized)) return 'command-injection-pattern';
  if (SSRF_PATTERN.test(normalized)) return 'ssrf-pattern';
  return '';
}

export default async function requestShield(request, context) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const contentLength = Number(request.headers.get('content-length') || 0);
  const userAgent = request.headers.get('user-agent') || '';
  const pathAndQuery = `${url.pathname}?${url.searchParams.toString()}`;

  if (!ALLOWED_METHODS.has(method)) {
    return block(405, 'method-blocked');
  }
  if (method === 'POST' && !POST_ALLOWED_PATHS.has(url.pathname)) {
    return block(405, 'post-path-blocked');
  }
  if (request.url.length > MAX_URL_LENGTH || url.search.length > MAX_QUERY_LENGTH) {
    return block(414, 'url-too-large');
  }
  if (contentLength > MAX_EDGE_CONTENT_LENGTH) {
    return block(413, 'payload-too-large');
  }
  if (SUSPICIOUS_USER_AGENT.test(userAgent)) {
    return block(403, 'scanner-user-agent');
  }
  if (SUSPICIOUS_PATH.test(url.pathname)) {
    return block(403, 'probe-path');
  }

  const reason = inspect(pathAndQuery);
  if (reason) {
    return block(403, reason);
  }

  const response = await context.next();
  response.headers.set('X-Request-Shield', 'active');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', response.headers.get('Referrer-Policy') || 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  path: '/*',
  rateLimit: {
    windowLimit: 240,
    windowSize: 60,
    aggregateBy: ['ip', 'domain']
  }
};
