const domain = process.argv[2] ?? 'harkingbade.com';
const urls = [
  `http://${domain}/`,
  `https://${domain}/`,
  `https://${domain}/robots.txt`,
  `https://${domain}/sitemap.xml`,
  `https://${domain}/sitemap-index.xml`,
  `https://${domain}/wp-json/`,
  `https://${domain}/vps-hosting-glossary-50-terms-every-user-should-know/`,
  `https://www.${domain}/`,
];

async function resolve(type) {
  try {
    const endpoint = new URL('https://cloudflare-dns.com/dns-query');
    endpoint.searchParams.set('name', domain);
    endpoint.searchParams.set('type', type);
    const response = await fetch(endpoint, {
      headers: {
        accept: 'application/dns-json',
        'user-agent': 'HarkingbadeRecoveryCheck/1.0',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) throw new Error(`DNS-over-HTTPS returned ${response.status}`);

    const result = await response.json();
    return {
      type,
      status: result.Status,
      answers: (result.Answer ?? []).map((answer) => ({
        value: answer.data,
        ttl: answer.TTL,
      })),
    };
  } catch (error) {
    return { type, error: error instanceof Error ? error.message : String(error) };
  }
}

async function probe(url) {
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      redirect: 'manual',
      headers: { 'user-agent': 'HarkingbadeRecoveryCheck/1.0' },
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.text();

    return {
      url,
      status: response.status,
      durationMs: Math.round(performance.now() - startedAt),
      location: response.headers.get('location'),
      server: response.headers.get('server'),
      cfRay: response.headers.get('cf-ray'),
      contentType: response.headers.get('content-type'),
      bodyBytes: Buffer.byteLength(body),
      bodySample: body.slice(0, 160).replace(/\s+/g, ' ').trim(),
    };
  } catch (error) {
    return {
      url,
      durationMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const [dns, http] = await Promise.all([
  Promise.all(['A', 'AAAA', 'NS'].map(resolve)),
  Promise.all(urls.map(probe)),
]);

const report = {
  checkedAt: new Date().toISOString(),
  domain,
  dnsProvider: 'Cloudflare DNS-over-HTTPS',
  dns,
  http,
  interpretation: {
    dnsPresent: dns.some((entry) => entry.answers?.length > 0),
    httpsHealthy: http
      .filter((entry) => entry.url.startsWith('https://'))
      .every((entry) => entry.status >= 200 && entry.status < 400),
  },
};

console.log(JSON.stringify(report, null, 2));
