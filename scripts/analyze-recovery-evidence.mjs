import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE_URL = 'https://harkingbade.com';
const ALLOWED_DECISIONS = new Set(['UNDECIDED', 'KEEP', '301', '404', '410', 'REVIEW']);

const sourceSpecs = {
  gsc: {
    label: 'Google Search Console pages',
    pathHeaders: ['top pages', 'page', 'landing page', 'url'],
    metrics: {
      searchConsoleClicks: ['clicks'],
      searchConsoleImpressions: ['impressions'],
      searchConsolePosition: ['position', 'average position'],
    },
  },
  ga4: {
    label: 'GA/GA4 landing pages',
    pathHeaders: [
      'landing page + query string',
      'landing page',
      'page path + query string',
      'page path and screen class',
      'page',
    ],
    metrics: {
      analyticsSessions: ['sessions'],
      engagedSessions: ['engaged sessions'],
      conversions: ['key events', 'conversions'],
      analyticsRevenue: ['total revenue', 'revenue'],
    },
  },
  backlinks: {
    label: 'Backlink target URLs',
    pathHeaders: ['target url', 'target', 'landing page', 'page', 'url'],
    metrics: {
      backlinks: ['backlinks', 'links'],
      referringDomains: ['referring domains', 'ref domains', 'domains'],
    },
  },
  adsense: {
    label: 'AdSense URL/channel performance',
    pathHeaders: ['page url', 'url', 'page', 'landing page'],
    metrics: {
      adsenseRevenue: ['estimated earnings', 'earnings', 'revenue'],
      adsensePageViews: ['page views', 'views'],
      adsenseClicks: ['clicks'],
    },
  },
};

function normalizeHeader(value) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[_–—-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (character === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  row.push(field.replace(/\r$/, ''));
  if (row.some((value) => value !== '')) rows.push(row);
  if (!rows.length) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])),
  );
}

export function normalizeLegacyPath(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  try {
    const url = new URL(raw, SITE_URL);
    let pathname = url.pathname.replace(/\/{2,}/g, '/');
    if (!pathname.startsWith('/')) pathname = `/${pathname}`;
    if (pathname !== '/' && !pathname.endsWith('/')) pathname += '/';
    return pathname;
  } catch {
    return null;
  }
}

function parseNumber(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '—' || raw === '-') return 0;
  const negative = raw.startsWith('(') && raw.endsWith(')');
  const numeric = Number(raw.replace(/[,$£€%()\s]/g, ''));
  return Number.isFinite(numeric) ? (negative ? -numeric : numeric) : 0;
}

function findHeader(row, candidates) {
  const headers = Object.keys(row);
  return candidates.map(normalizeHeader).find((candidate) => headers.includes(candidate)) ?? null;
}

export function aggregateSourceRows(rows, spec) {
  if (!rows.length) return { byPath: new Map(), unmatched: [], headers: [] };
  const pathHeader = findHeader(rows[0], spec.pathHeaders);
  if (!pathHeader) {
    throw new Error(
      `${spec.label} has no recognized URL column. Expected one of: ${spec.pathHeaders.join(', ')}.`,
    );
  }

  const metricHeaders = Object.fromEntries(
    Object.entries(spec.metrics).map(([metric, candidates]) => [metric, findHeader(rows[0], candidates)]),
  );
  const foundMetrics = Object.values(metricHeaders).filter(Boolean);
  if (!foundMetrics.length) {
    throw new Error(`${spec.label} has no recognized metric columns.`);
  }

  const byPath = new Map();
  const unmatched = [];
  for (const row of rows) {
    const legacyPath = normalizeLegacyPath(row[pathHeader]);
    if (!legacyPath) {
      unmatched.push(row[pathHeader]);
      continue;
    }
    const current = byPath.get(legacyPath) ?? {};
    for (const [metric, header] of Object.entries(metricHeaders)) {
      if (!header) continue;
      const numeric = parseNumber(row[header]);
      if (metric === 'searchConsolePosition') {
        const impressionsHeader = metricHeaders.searchConsoleImpressions;
        const weight = impressionsHeader ? Math.max(parseNumber(row[impressionsHeader]), 1) : 1;
        current.__positionWeightedSum = (current.__positionWeightedSum ?? 0) + numeric * weight;
        current.__positionWeight = (current.__positionWeight ?? 0) + weight;
      } else {
        current[metric] = (current[metric] ?? 0) + numeric;
      }
    }
    byPath.set(legacyPath, current);
  }

  for (const metrics of byPath.values()) {
    if (metrics.__positionWeight) {
      metrics.searchConsolePosition = metrics.__positionWeightedSum / metrics.__positionWeight;
      delete metrics.__positionWeightedSum;
      delete metrics.__positionWeight;
    }
  }

  return { byPath, unmatched, headers: [pathHeader, ...foundMetrics] };
}

function truthy(value) {
  return ['1', 'true', 'yes', 'y'].includes(String(value ?? '').trim().toLowerCase());
}

function parseManualRows(rows) {
  const byPath = new Map();
  const errors = [];
  if (!rows.length) return { byPath, errors };
  const requiredPath = findHeader(rows[0], ['legacy path', 'old url', 'url', 'path']);
  if (!requiredPath) throw new Error('Manual review CSV requires a legacy_path or old_url column.');

  for (const [index, row] of rows.entries()) {
    const legacyPath = normalizeLegacyPath(row[requiredPath]);
    if (!legacyPath) {
      errors.push(`Manual row ${index + 2}: invalid legacy path.`);
      continue;
    }
    const value = (candidates) => {
      const header = findHeader(row, candidates);
      return header ? String(row[header] ?? '').trim() : '';
    };
    const decision = value(['decision']).toUpperCase() || 'UNDECIDED';
    const destination = normalizeLegacyPath(value(['destination', 'target url'])) || null;
    const decisionReason = value(['decision reason', 'reason']) || null;
    const owner = value(['owner']) || null;
    const verifiedAt = value(['verified at', 'verified date']) || null;

    if (!ALLOWED_DECISIONS.has(decision)) {
      errors.push(`Manual row ${index + 2}: invalid decision ${decision}.`);
    }
    if (decision !== 'UNDECIDED') {
      if (!decisionReason) errors.push(`Manual row ${index + 2}: decision requires a reason.`);
      if (!owner) errors.push(`Manual row ${index + 2}: decision requires an owner.`);
      if (!verifiedAt || !/^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)) {
        errors.push(`Manual row ${index + 2}: decision requires verified_at in YYYY-MM-DD format.`);
      }
      if (decision === '301' && !destination) {
        errors.push(`Manual row ${index + 2}: 301 requires a destination.`);
      }
    }

    byPath.set(legacyPath, {
      decision,
      destination,
      decisionReason,
      owner,
      verifiedAt,
      manualAction: truthy(value(['manual action'])),
      securityIssue: truthy(value(['security issue'])),
      legalRisk: truthy(value(['legal risk'])),
      currentIntent: value(['current intent']) || null,
      notes: value(['notes']) || null,
    });
  }
  return { byPath, errors };
}

function reviewScore(record) {
  let score = 0;
  if ((record.searchConsoleClicks ?? 0) > 0) score += 25;
  if ((record.searchConsoleImpressions ?? 0) > 0) score += 10;
  if ((record.analyticsSessions ?? 0) > 0) score += 20;
  if ((record.conversions ?? 0) > 0 || (record.analyticsRevenue ?? 0) > 0) score += 15;
  if ((record.adsenseRevenue ?? 0) > 0) score += 10;
  if ((record.backlinks ?? 0) > 0 || (record.referringDomains ?? 0) > 0) score += 20;
  return score;
}

function reviewQueue(record) {
  const risk =
    record.reviewReasons.length > 0 ||
    record.manualAction ||
    record.securityIssue ||
    record.legalRisk;
  if (risk) return 'RISK_REVIEW';
  if (record.evidenceScore >= 60) return 'P0_EQUITY';
  if (record.evidenceScore >= 30) return 'P1_EQUITY';
  if (record.evidenceScore > 0) return 'P2_SIGNAL';
  return 'P3_NO_PRIVATE_SIGNAL';
}

function reviewPrompt(record) {
  if (record.decision !== 'UNDECIDED') return 'APPROVED_MANUAL_DECISION';
  if (record.reviewQueue === 'RISK_REVIEW') return 'HUMAN_RISK_AND_EQUITY_REVIEW';
  if (record.evidenceScore >= 30) return 'HUMAN_KEEP_OR_CLOSE_301_REVIEW';
  if (record.evidenceScore > 0) return 'HUMAN_INTENT_AND_EQUITY_REVIEW';
  return 'HUMAN_404_OR_410_REVIEW';
}

function escapeMarkdown(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-CA', { maximumFractionDigits: 2 }).format(value ?? 0);
}

function createReport(result) {
  const top = result.urls
    .filter((record) => record.pageType === 'content')
    .sort(
      (a, b) =>
        b.evidenceScore - a.evidenceScore ||
        (b.searchConsoleClicks ?? 0) - (a.searchConsoleClicks ?? 0) ||
        a.path.localeCompare(b.path),
    )
    .slice(0, 100);
  const sourceRows = Object.entries(result.sources)
    .map(
      ([source, details]) =>
        `| ${source} | ${details.file ? `\`${escapeMarkdown(details.file)}\`` : 'not supplied'} | ${details.rows ?? 0} | ${details.matchedPaths ?? 0} |`,
    )
    .join('\n');
  const queueRows = Object.entries(result.summary.byReviewQueue)
    .map(([queue, count]) => `| ${queue} | ${formatNumber(count)} |`)
    .join('\n');
  const topRows = top
    .map(
      (record) =>
        `| \`${escapeMarkdown(record.path)}\` | ${record.topic} | ${record.evidenceScore} | ${formatNumber(record.searchConsoleClicks)} | ${formatNumber(record.analyticsSessions)} | ${formatNumber(record.conversions)} | ${formatNumber((record.analyticsRevenue ?? 0) + (record.adsenseRevenue ?? 0))} | ${formatNumber(record.referringDomains)} | ${record.reviewQueue} |`,
    )
    .join('\n');

  return `# Harkingbade Private Recovery Evidence Report

Generated: ${result.generatedAt}  
Scope: private URL-level evidence joined to the public archive inventory  
Decision policy: no automatic KEEP, 301, 404, 410, or REVIEW dispositions

## Source coverage

| Source | File | Rows | Matched paths |
|---|---|---:|---:|
${sourceRows}

## Review queues

| Queue | URLs |
|---|---:|
${queueRows}

The score prioritizes human review; it is not a ranking or redirect decision. Current clicks contribute 25 points, impressions 10, analytics sessions 20, conversions/revenue 15, AdSense revenue 10, and backlinks/referring domains 20. Risk-language, manual-action, security, or legal flags always enter the risk queue.

## Highest-evidence content paths

| Path | Topic | Score | GSC clicks | Sessions | Conversions | Revenue | Ref. domains | Queue |
|---|---|---:|---:|---:|---:|---:|---:|---|
${topRows || '| — | — | — | — | — | — | — | — | — |'}

## Decision controls

- Every disposition remains human-owned unless a valid manual review row supplies decision, reason, owner, and verified date.
- A 301 also requires an intent-matched destination.
- The script never edits \`public/_redirects\`.
- Missing private signal is not proof that a URL has no value; complete source coverage and current-content review are still required.
`;
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) throw new Error(`Unexpected argument: ${argument}`);
    const key = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    options[key] = value;
    index += 1;
  }
  return options;
}

async function loadCsv(file) {
  return parseCsv(await fs.readFile(file, 'utf8'));
}

export async function analyzeEvidence(options) {
  const inventoryFile = options.inventory ?? 'data/legacy-url-inventory.json';
  const inventory = JSON.parse(await fs.readFile(inventoryFile, 'utf8'));
  if (!Array.isArray(inventory.urls)) throw new Error('Inventory file has no urls array.');

  const supplied = Object.keys(sourceSpecs).filter((source) => options[source]);
  if (!supplied.length && !options.manual) {
    throw new Error('Supply at least one of --gsc, --ga4, --backlinks, --adsense, or --manual.');
  }

  const sourceData = {};
  const sources = {};
  for (const source of Object.keys(sourceSpecs)) {
    const file = options[source];
    if (!file) {
      sources[source] = { file: null, rows: 0, matchedPaths: 0 };
      continue;
    }
    const rows = await loadCsv(file);
    const aggregate = aggregateSourceRows(rows, sourceSpecs[source]);
    sourceData[source] = aggregate.byPath;
    sources[source] = {
      file,
      rows: rows.length,
      matchedPaths: 0,
      unmatchedRows: aggregate.unmatched.length,
      recognizedHeaders: aggregate.headers,
    };
  }

  const manualRows = options.manual ? await loadCsv(options.manual) : [];
  const manual = parseManualRows(manualRows);
  if (manual.errors.length) {
    throw new Error(`Manual review validation failed:\n- ${manual.errors.join('\n- ')}`);
  }

  const urls = inventory.urls.map((record) => {
    const enriched = { ...record };
    for (const source of Object.keys(sourceSpecs)) {
      const metrics = sourceData[source]?.get(record.path);
      if (metrics) {
        Object.assign(enriched, metrics);
        sources[source].matchedPaths += 1;
      }
    }
    Object.assign(enriched, manual.byPath.get(record.path) ?? {});
    enriched.reviewReasons = Array.isArray(enriched.reviewReasons) ? enriched.reviewReasons : [];
    enriched.evidenceScore = reviewScore(enriched);
    enriched.reviewQueue = reviewQueue(enriched);
    enriched.reviewPrompt = reviewPrompt(enriched);
    return enriched;
  });

  const inventoryPaths = new Set(inventory.urls.map((record) => record.path));
  const unmatchedPaths = {};
  for (const source of Object.keys(sourceSpecs)) {
    unmatchedPaths[source] = [...(sourceData[source]?.keys() ?? [])].filter(
      (legacyPath) => !inventoryPaths.has(legacyPath),
    );
  }
  unmatchedPaths.manual = [...manual.byPath.keys()].filter((legacyPath) => !inventoryPaths.has(legacyPath));

  const byReviewQueue = {};
  for (const record of urls) {
    byReviewQueue[record.reviewQueue] = (byReviewQueue[record.reviewQueue] ?? 0) + 1;
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    inventoryFile,
    evidencePolicy:
      'Private signals prioritize human review. Only validated manual rows can assign a disposition.',
    sources,
    summary: {
      inventoryUrls: urls.length,
      contentUrls: urls.filter((record) => record.pageType === 'content').length,
      manuallyDecided: urls.filter((record) => record.decision !== 'UNDECIDED').length,
      byReviewQueue,
      unmatchedPathCounts: Object.fromEntries(
        Object.entries(unmatchedPaths).map(([source, paths]) => [source, paths.length]),
      ),
    },
    unmatchedPaths,
    urls,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const jsonOut = path.resolve(options['json-out'] ?? 'data/private/legacy-evidence.json');
  const reportOut = path.resolve(options['report-out'] ?? 'docs/private/legacy-evidence-report.md');
  const publicRoot = path.resolve('public');
  if (jsonOut.startsWith(publicRoot) || reportOut.startsWith(publicRoot)) {
    throw new Error('Private recovery evidence cannot be written under public/.');
  }

  const result = await analyzeEvidence(options);
  await fs.mkdir(path.dirname(jsonOut), { recursive: true });
  await fs.mkdir(path.dirname(reportOut), { recursive: true });
  await fs.writeFile(jsonOut, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await fs.writeFile(reportOut, createReport(result), 'utf8');
  console.log(
    `Recovery evidence written: ${result.urls.length} URLs; ${result.summary.manuallyDecided} approved manual decisions.`,
  );
  console.log(jsonOut);
  console.log(reportOut);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
