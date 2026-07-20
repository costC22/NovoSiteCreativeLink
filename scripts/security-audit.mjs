import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const htmlFiles = readdirSync(root).filter((file) => file.endsWith('.html'));
const publicFiles = [...htmlFiles, 'script.js', 'styles.css', '_headers'].filter((file) => existsSync(join(root, file)));
const publicText = publicFiles.map((file) => readFileSync(join(root, file), 'utf8')).join('\n');
const headers = existsSync(join(root, '_headers')) ? readFileSync(join(root, '_headers'), 'utf8') : '';
const functionsExist = ['contact.mts', 'csp-report.mts', 'security-metrics.mts'].every((file) =>
  existsSync(join(root, 'netlify', 'functions', file))
);

const headerNames = [
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Strict-Transport-Security',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
  'Origin-Agent-Cluster',
  'X-Permitted-Cross-Domain-Policies',
  'Reporting-Endpoints'
];

const checks = [
  {
    id: 'external_form_endpoint_removed',
    pass: !/formspree\.io|<form[^>]+action=["']https?:\/\//i.test(publicText)
  },
  {
    id: 'contact_forms_use_api_proxy',
    pass: htmlFiles.every((file) => !/formspree\.io/i.test(readFileSync(join(root, file), 'utf8')))
  },
  {
    id: 'no_browser_storage_for_leads',
    pass: !/localStorage|sessionStorage|indexedDB/i.test(publicText)
  },
  {
    id: 'dangerous_dom_sinks_removed',
    pass: !/innerHTML|insertAdjacentHTML|eval\s*\(|new Function\s*\(/i.test(publicText)
  },
  {
    id: 'inline_style_attributes_removed',
    pass: !/\sstyle=["']/i.test(publicText)
  },
  {
    id: 'script_csp_without_unsafe_inline',
    pass: /script-src 'self'/i.test(headers) && !/script-src[^\n;]*'unsafe-inline'/i.test(headers)
  },
  {
    id: 'connect_src_self_only',
    pass: /connect-src 'self'/i.test(headers) && !/connect-src[^\n]*formspree/i.test(headers)
  },
  {
    id: 'csp_reporting_enabled',
    pass: /report-uri \/api\/csp-report/i.test(headers) && /Reporting-Endpoints/i.test(headers)
  },
  {
    id: 'security_functions_present',
    pass: functionsExist
  },
  {
    id: 'strict_header_set',
    pass: headerNames.filter((name) => headers.includes(name)).length >= 10
  }
];

const passed = checks.filter((check) => check.pass).length;
const score = Math.round((passed / checks.length) * 100);
const report = {
  generatedAt: new Date().toISOString(),
  score,
  passed,
  total: checks.length,
  checks: checks.map((check) => ({ id: check.id, status: check.pass ? 'pass' : 'fail' }))
};

if (process.argv.includes('--write')) {
  writeFileSync(join(root, '.well-known', 'security-metrics.json'), `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));

if (process.argv.includes('--check') && passed !== checks.length) {
  process.exit(1);
}
