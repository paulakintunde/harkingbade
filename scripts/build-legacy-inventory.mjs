import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const generatedAt = '2026-08-16';
const sourceUrl = 'https://web.archive.org/cdx/search/cdx';
const hosts = ['harkingbade.com/*', 'www.harkingbade.com/*'];

function buildQuery(host) {
  const url = new URL(sourceUrl);
  url.searchParams.set('url', host);
  url.searchParams.set('output', 'json');
  url.searchParams.set('fl', 'timestamp,original,statuscode,mimetype,digest');
  url.searchParams.append('filter', 'statuscode:200');
  url.searchParams.append('filter', 'mimetype:text/html');
  url.searchParams.set('from', '2012');
  url.searchParams.set('to', '2026');
  return url;
}

async function fetchJsonWithRetry(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { accept: 'application/json', 'user-agent': 'Harkingbade migration inventory' },
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) throw new Error(`Archive request failed with ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
  throw lastError;
}

function normalizePath(original) {
  try {
    const url = new URL(original);
    let pathname = decodeURI(url.pathname).replace(/\/{2,}/g, '/').toLowerCase();
    if (!pathname.startsWith('/')) pathname = `/${pathname}`;
    if (pathname !== '/' && !pathname.endsWith('/') && !/\.[a-z0-9]{1,8}$/i.test(pathname)) {
      pathname += '/';
    }
    return { host: url.hostname.toLowerCase(), path: pathname };
  } catch {
    return null;
  }
}

function pageType(pathname) {
  if (pathname === '/') return 'home';
  if (/^\/(tag|category|author)\//.test(pathname)) return 'taxonomy';
  if (/^\/page\/\d+\//.test(pathname)) return 'pagination';
  if (/\/(feed|comments\/feed)\/?$/.test(pathname)) return 'feed';
  if (/^\/(wp-json|wp-admin|wp-content|wp-includes)\//.test(pathname)) return 'technical';
  return 'content';
}

function topic(pathname) {
  const rules = [
    ['hosting-vps-linux', /vps|hosting|hostinger|cloudways|digitalocean|linode|linux|ubuntu|server|ssh|nginx|apache|ssl|self-host/],
    ['programming-web', /program|developer|coding|code-editor|javascript|angular|react|php|python|html|css|wordpress|website|web-/],
    ['mobile', /android|iphone|ipad|ios|mobile|smartphone|samsung|nokia|blackberry|whatsapp/],
    ['windows-software', /windows|microsoft|office|software|computer|laptop|pc-|driver/],
    ['gaming-entertainment', /game|gaming|gta|movie|film|netflix|music|anime|stream|youtube|tv-/],
    ['seo-marketing', /seo|keyword|backlink|marketing|social-media|facebook|twitter|instagram|blogging|adsense|traffic/],
    ['business-career', /business|startup|entrepreneur|career|job|resume|productiv|make-money|freelanc|ecommerce|shopify/],
    ['accounts-access', /login|log-in|signin|sign-in|account|password|register/],
  ];
  return rules.find(([, pattern]) => pattern.test(pathname))?.[0] ?? 'other';
}

function reviewReasons(pathname) {
  const reasons = [];
  const checks = [
    ['downloads-or-copyright', /download|torrent|movie|watch-online|stream-free|free-stream|mp3|apk|rom-/],
    ['activation-or-circumvention', /activate-windows|windows-[^/]*activat|office-[^/]*activat|activation-(key|code)|crack|keygen|serial-key|product-key|bypass|unlock/],
    ['hacking-cheats-or-device-modification', /hack|cheat|jailbreak|root-|emulator/],
    ['account-or-login-intent', /login|log-in|signin|sign-in|account-access|password/],
    ['likely-obsolete-platform', /windows-(xp|vista|7|8)|iphone-[456]|ios-[4-9]|blackberry|symbian|201[2-8]/],
  ];
  for (const [reason, pattern] of checks) if (pattern.test(pathname)) reasons.push(reason);
  return reasons;
}

function countBy(items, getter) {
  return Object.fromEntries(
    [...items.reduce((map, item) => {
      const key = getter(item);
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map())].sort((a, b) => b[1] - a[1]),
  );
}

function markdownTable(rows) {
  if (!rows.length) return '_None found._';
  const header = '| Path | Topic | Page type | Review reasons | Last capture |';
  const divider = '|---|---|---|---|---|';
  const body = rows.map((item) => {
    const escapedPath = `\`${item.path.replaceAll('|', '\\|')}\``;
    return `| ${escapedPath} | ${item.topic} | ${item.pageType} | ${item.reviewReasons.join(', ')} | ${item.lastCapture.slice(0, 8)} |`;
  });
  return [header, divider, ...body].join('\n');
}

const responses = await Promise.all(hosts.map((host) => fetchJsonWithRetry(buildQuery(host))));
const captureRows = [];

for (const response of responses) {
  if (!Array.isArray(response) || response.length < 1) continue;
  const [header, ...rows] = response;
  for (const row of rows) captureRows.push(Object.fromEntries(header.map((key, index) => [key, row[index]])));
}

const grouped = new Map();
for (const capture of captureRows) {
  const normalized = normalizePath(capture.original);
  if (!normalized) continue;
  const existing = grouped.get(normalized.path) ?? {
    path: normalized.path,
    hosts: new Set(),
    firstCapture: capture.timestamp,
    lastCapture: capture.timestamp,
    sampleOriginal: capture.original,
    captures: 0,
  };
  existing.hosts.add(normalized.host);
  existing.firstCapture = existing.firstCapture < capture.timestamp ? existing.firstCapture : capture.timestamp;
  if (capture.timestamp > existing.lastCapture) {
    existing.lastCapture = capture.timestamp;
    existing.sampleOriginal = capture.original;
  }
  existing.captures += 1;
  grouped.set(normalized.path, existing);
}

const urls = [...grouped.values()]
  .map((entry) => {
    const reasons = reviewReasons(entry.path);
    return {
      path: entry.path,
      hosts: [...entry.hosts].sort(),
      firstCapture: entry.firstCapture,
      lastCapture: entry.lastCapture,
      captures: entry.captures,
      sampleOriginal: entry.sampleOriginal,
      archiveUrl: `https://web.archive.org/web/${entry.lastCapture}/${entry.sampleOriginal}`,
      pageType: pageType(entry.path),
      topic: topic(entry.path),
      reviewReasons: reasons,
      reviewPriority: reasons.length ? 'priority-review' : 'standard-review',
      decision: 'UNDECIDED',
      destination: null,
      decisionReason: null,
      searchConsoleClicks: null,
      analyticsSessions: null,
      revenueOrLeads: null,
      backlinks: null,
      owner: null,
      verifiedAt: null,
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

const contentUrls = urls.filter((item) => item.pageType === 'content');
const priorityReview = contentUrls.filter((item) => item.reviewReasons.length > 0);
const reasonCounts = {};
for (const item of priorityReview) {
  for (const reason of item.reviewReasons) reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
}

const summary = {
  captureRows: captureRows.length,
  uniquePaths: urls.length,
  contentPaths: contentUrls.length,
  priorityReviewPaths: priorityReview.length,
  byPageType: countBy(urls, (item) => item.pageType),
  contentByTopic: countBy(contentUrls, (item) => item.topic),
  priorityReviewReasons: Object.fromEntries(Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])),
};

const inventory = {
  schemaVersion: 1,
  generatedAt,
  evidenceScope: 'Public Internet Archive CDX captures only. No disposition is approved without private analytics, link, legal, and current-content review.',
  sourceQueries: hosts.map((host) => buildQuery(host).toString()),
  summary,
  urls,
};

const markdown = `# Harkingbade Public Legacy URL Inventory

Generated: ${generatedAt}  
Source: Internet Archive CDX API  
Authority: discovery evidence only; not an approved redirect or deletion plan

## Inventory summary

- Capture rows processed: **${summary.captureRows.toLocaleString()}**
- Unique normalized paths: **${summary.uniquePaths.toLocaleString()}**
- Content paths: **${summary.contentPaths.toLocaleString()}**
- Content paths requiring priority review: **${summary.priorityReviewPaths.toLocaleString()}**

### Page types

${Object.entries(summary.byPageType).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

### Content topics

${Object.entries(summary.contentByTopic).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

### Priority-review reasons

${Object.entries(summary.priorityReviewReasons).map(([key, value]) => `- ${key}: ${value}`).join('\n') || '- None'}

## Decision policy

Every URL remains **UNDECIDED**. Archive presence does not prove current traffic, backlinks, revenue, safety, accuracy, or intent. Enrich the JSON records with Search Console, analytics, AdSense, backlink, legal, and current-content evidence before assigning KEEP, 301, 404, 410, or REVIEW.

No redirect is published in \`public/_redirects\` until its destination is proven to satisfy the same user need.

## Priority-review content paths

${markdownTable(priorityReview)}

## Authoritative generated data

The complete machine-readable inventory is \`data/legacy-url-inventory.json\`. Regenerate both artifacts with \`npm run research:archive\`.
`;

await mkdir(path.resolve('data'), { recursive: true });
await mkdir(path.resolve('docs'), { recursive: true });
await writeFile(path.resolve('data/legacy-url-inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
await writeFile(path.resolve('docs/legacy-url-inventory.md'), markdown, 'utf8');

console.log(
  `Archive inventory generated: ${summary.captureRows} captures, ${summary.uniquePaths} unique paths, ${summary.contentPaths} content paths, ${summary.priorityReviewPaths} priority-review paths.`,
);
