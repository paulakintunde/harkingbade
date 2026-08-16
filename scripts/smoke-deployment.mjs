const args = process.argv.slice(2);
const production = args.includes('--production');
const requireContact = args.includes('--require-contact');
const requireNewsletter = args.includes('--require-newsletter');
const newsletterEmail =
  args.find((arg) => arg.startsWith('--newsletter-email='))?.slice('--newsletter-email='.length) ?? '';
const baseArgument = args.find((arg) => !arg.startsWith('--')) ?? 'http://127.0.0.1:8787';
const base = new URL(baseArgument.endsWith('/') ? baseArgument : `${baseArgument}/`);
const failures = [];
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  if (!ok) failures.push(`${name}: ${detail}`);
}

async function request(path, options = {}) {
  const url = new URL(path, base);
  const startedAt = performance.now();
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
      ...options,
    });
    const body = await response.text();
    return {
      response,
      body,
      durationMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      durationMs: Math.round(performance.now() - startedAt),
    };
  }
}

const pagePaths = [
  '/',
  '/about/',
  '/career/',
  '/work/',
  '/services/',
  '/insights/',
  '/insights/privacy-conscious-conversion-analytics-cloudflare-workers/',
  '/lab/',
  '/resources/',
  '/resources/4d-diagnostic/',
  '/newsletter/',
  '/contact/',
];
for (const path of pagePaths) {
  const result = await request(path);
  const status = result.response?.status;
  record(`${path} returns 200`, status === 200, result.error ?? `status ${status}`);
  if (path === '/' && result.response) {
    record(
      'homepage has CSP',
      Boolean(result.response.headers.get('content-security-policy')),
      result.response.headers.get('content-security-policy') ?? 'header missing',
    );
    record(
      'homepage blocks framing',
      result.response.headers.get('x-frame-options') === 'DENY',
      result.response.headers.get('x-frame-options') ?? 'header missing',
    );
    record(
      'homepage prevents MIME sniffing',
      result.response.headers.get('x-content-type-options') === 'nosniff',
      result.response.headers.get('x-content-type-options') ?? 'header missing',
    );
    record(
      'homepage canonical is production apex',
      result.body?.includes('<link rel="canonical" href="https://harkingbade.com/"') ?? false,
      'expected canonical https://harkingbade.com/',
    );
  }
}

for (const path of ['/robots.txt', '/sitemap-index.xml', '/rss.xml', '/favicon.svg']) {
  const result = await request(path);
  record(`${path} returns 200`, result.response?.status === 200, result.error ?? `status ${result.response?.status}`);
}

const missing = await request('/definitely-not-a-real-page/');
record('unknown page returns true 404', missing.response?.status === 404, missing.error ?? `status ${missing.response?.status}`);

const health = await request('/api/health');
let healthPayload;
try {
  healthPayload = JSON.parse(health.body ?? '');
} catch {
  healthPayload = null;
}
record(
  '/api/health is healthy',
  health.response?.status === 200 && healthPayload?.ok === true && healthPayload?.service === 'harkingbade',
  health.error ?? `status ${health.response?.status}; body ${health.body?.slice(0, 120)}`,
);

const contactPage = await request('/contact/');
const contactFormExposed = contactPage.body?.includes('data-contact-form') ?? false;
record(
  requireContact ? 'verified contact build exposes the form' : 'unverified contact build hides the form',
  requireContact ? contactFormExposed : !contactFormExposed,
  contactFormExposed ? 'contact form present' : 'email-only contact route present',
);

const analyticsNoop = await request('/api/events', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: base.origin },
  body: JSON.stringify({
    event: 'cta_click',
    properties: {
      page_path: '/deployment-smoke-test/',
      source_page: '/deployment-smoke-test/',
      destination: '/contact/',
      cta_id: 'deployment-smoke-test',
      audience_route: 'verification',
    },
  }),
});
record(
  'analytics endpoint accepts a bounded event',
  analyticsNoop.response?.status === 204,
  analyticsNoop.error ?? `status ${analyticsNoop.response?.status}; body ${analyticsNoop.body?.slice(0, 120)}`,
);

const analyticsPii = await request('/api/events', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: base.origin },
  body: JSON.stringify({
    event: 'contact_start',
    properties: { page_path: '/contact/', email: 'must-not-be-accepted@example.test' },
  }),
});
record(
  'analytics endpoint rejects personal-information fields',
  analyticsPii.response?.status === 422,
  analyticsPii.error ?? `status ${analyticsPii.response?.status}; body ${analyticsPii.body?.slice(0, 120)}`,
);

const unknownApi = await request('/api/not-real');
record('unknown API returns 404', unknownApi.response?.status === 404, unknownApi.error ?? `status ${unknownApi.response?.status}`);

if (base.hostname.endsWith('.workers.dev')) {
  const preview = await request('/');
  const robotsHeader = preview.response?.headers.get('x-robots-tag') ?? '';
  record('workers.dev preview is noindex', robotsHeader.includes('noindex'), robotsHeader || 'header missing');
}

if (requireContact) {
  const contact = await request('/api/contact', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin: base.origin,
    },
    body: new URLSearchParams({
      name: 'Deployment Test',
      email: 'deployment-test@example.com',
      interest: 'deployment-test',
      message: 'Automated deployment verification message; this should reach the configured test destination.',
      source: '/deployment-smoke-test/',
    }),
  });
  record('contact delivery returns 201', contact.response?.status === 201, contact.error ?? `status ${contact.response?.status}; body ${contact.body?.slice(0, 160)}`);
}

if (requireNewsletter) {
  if (!newsletterEmail) {
    record(
      'newsletter delivery address is supplied',
      false,
      'add --newsletter-email=<controlled-inbox>',
    );
  } else {
    const newsletter = await request('/api/newsletter', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        origin: base.origin,
      },
      body: new URLSearchParams({
        email: newsletterEmail,
        consent: 'subscribe',
        source: '/deployment-smoke-test/',
      }),
    });
    record(
      'newsletter delivery returns 201',
      newsletter.response?.status === 201,
      newsletter.error ??
        `status ${newsletter.response?.status}; body ${newsletter.body?.slice(0, 160)}`,
    );
  }
}

if (production) {
  record('production base is canonical apex', base.origin === 'https://harkingbade.com', `received ${base.origin}`);
  const www = await fetch(`https://www.harkingbade.com${base.pathname}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(15_000),
  });
  record(
    'www redirects one hop to apex',
    www.status === 301 && www.headers.get('location') === base.toString(),
    `status ${www.status}; location ${www.headers.get('location')}`,
  );
}

for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name} — ${result.detail}`);
}

console.log(`\n${results.length - failures.length}/${results.length} deployment checks passed for ${base.origin}.`);
if (failures.length) {
  console.error(`\nFailures:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
}
