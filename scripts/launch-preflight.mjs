import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateFounderEvidence } from './validate-founder-evidence.mjs';

const RELEASE_VERSION = 'harkingbade-release-evidence-v1';
const VALID_TARGETS = new Set(['staging', 'production']);

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validDate(value) {
  return hasText(value) && Number.isFinite(Date.parse(value));
}

function check(id, label, status, detail, nextAction = null) {
  return { id, label, status, detail, nextAction };
}

export function parseRedirectRules(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [source, destination, status] = line.split(/\s+/);
      return { source, destination, status };
    });
}

export function validateReleaseEvidence(input, target = 'production') {
  const missing = [];
  const requireText = (value, pathName) => {
    if (!hasText(value)) missing.push(pathName);
  };
  const requireTrue = (value, pathName) => {
    if (value !== true) missing.push(pathName);
  };

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, missing: ['release evidence JSON object'], errors: [] };
  }
  const errors = [];
  if (input.version !== RELEASE_VERSION) errors.push(`version must be ${RELEASE_VERSION}.`);
  requireText(input.operator, 'operator');
  if (!validDate(input.reviewedAt)) missing.push('reviewedAt');

  const cloudflare = input.cloudflare ?? {};
  requireTrue(cloudflare.accountAndZoneConfirmed, 'cloudflare.accountAndZoneConfirmed');
  requireText(cloudflare.accountAndZoneEvidence, 'cloudflare.accountAndZoneEvidence');
  requireTrue(cloudflare.currentRouteInspected, 'cloudflare.currentRouteInspected');
  requireTrue(cloudflare.rollbackSnapshotCaptured, 'cloudflare.rollbackSnapshotCaptured');
  requireText(cloudflare.rollbackSnapshotReference, 'cloudflare.rollbackSnapshotReference');

  if (target === 'production') {
    const staging = input.staging ?? {};
    requireText(staging.url, 'staging.url');
    requireTrue(staging.smokePassed, 'staging.smokePassed');
    requireTrue(staging.noindexVerified, 'staging.noindexVerified');
    requireText(staging.evidenceReference, 'staging.evidenceReference');

    const contact = input.contact ?? {};
    if (!['webhook', 'email-only', 'disabled'].includes(contact.launchMode)) {
      missing.push('contact.launchMode');
    } else if (contact.launchMode === 'webhook') {
      requireTrue(contact.productionDeliveryVerified, 'contact.productionDeliveryVerified');
      requireText(contact.evidenceReference, 'contact.evidenceReference');
    } else if (contact.launchMode === 'email-only') {
      requireTrue(contact.publicAddressVerified, 'contact.publicAddressVerified');
      requireTrue(contact.pageUpdatedForMode, 'contact.pageUpdatedForMode');
    } else {
      requireTrue(contact.pageUpdatedForMode, 'contact.pageUpdatedForMode');
    }

    const newsletter = input.newsletter ?? {};
    if (!['disabled', 'enabled'].includes(newsletter.launchMode)) {
      missing.push('newsletter.launchMode');
    } else if (newsletter.launchMode === 'enabled') {
      requireText(newsletter.provider, 'newsletter.provider');
      requireTrue(newsletter.sendingDomainAuthenticated, 'newsletter.sendingDomainAuthenticated');
      requireTrue(newsletter.consentRecordVerified, 'newsletter.consentRecordVerified');
      requireTrue(newsletter.unsubscribeVerified, 'newsletter.unsubscribeVerified');
      requireTrue(newsletter.suppressionVerified, 'newsletter.suppressionVerified');
      requireTrue(newsletter.deliveryVerified, 'newsletter.deliveryVerified');
      requireText(newsletter.evidenceReference, 'newsletter.evidenceReference');
    }

    const search = input.search ?? {};
    requireTrue(search.searchConsoleOwnershipVerified, 'search.searchConsoleOwnershipVerified');
    requireTrue(search.sitemapSubmissionReady, 'search.sitemapSubmissionReady');

    const performance = input.performance ?? {};
    requireTrue(performance.stagingTraceRecorded, 'performance.stagingTraceRecorded');
    requireText(performance.evidenceReference, 'performance.evidenceReference');

    const cutover = input.cutover ?? {};
    requireTrue(cutover.windowApproved, 'cutover.windowApproved');
    requireText(cutover.rollbackOwner, 'cutover.rollbackOwner');
  }

  return { valid: errors.length === 0 && missing.length === 0, missing, errors };
}

async function latestMtime(root, relativePaths) {
  let latest = 0;
  const visit = async (file) => {
    if (!(await exists(file))) return;
    const stat = await fs.stat(file);
    if (stat.isDirectory()) {
      for (const entry of await fs.readdir(file, { withFileTypes: true })) {
        await visit(path.join(file, entry.name));
      }
    } else {
      latest = Math.max(latest, stat.mtimeMs);
    }
  };
  for (const relative of relativePaths) await visit(path.join(root, relative));
  return latest;
}

export async function runLaunchPreflight({ root = process.cwd(), target = 'production' } = {}) {
  if (!VALID_TARGETS.has(target)) throw new Error('target must be staging or production.');
  const checks = [];

  const distIndex = path.join(root, 'dist', 'index.html');
  const requiredBuildFiles = [
    distIndex,
    path.join(root, 'dist', '404.html'),
    path.join(root, 'dist', 'robots.txt'),
    path.join(root, 'dist', 'sitemap-index.xml'),
  ];
  const buildPresent = (await Promise.all(requiredBuildFiles.map(exists))).every(Boolean);
  const sourceMtime = await latestMtime(root, ['src', 'public', 'worker', 'astro.config.mjs', 'wrangler.jsonc']);
  const buildMtime = buildPresent ? (await fs.stat(distIndex)).mtimeMs : 0;
  checks.push(
    check(
      'build',
      'Production build output',
      buildPresent && buildMtime >= sourceMtime ? 'PASS' : 'BLOCKED',
      buildPresent && buildMtime >= sourceMtime ? 'Required build artifacts exist and are newer than site/runtime sources.' : 'Build output is missing or stale.',
      'Run npm run build and retain its verifier output.',
    ),
  );

  const wrangler = await readJson(path.join(root, 'wrangler.jsonc'));
  const analyticsDisabled =
    wrangler.vars?.ANALYTICS_ENABLED === 'false' &&
    wrangler.env?.staging?.vars?.ANALYTICS_ENABLED === 'false' &&
    wrangler.env?.production?.vars?.ANALYTICS_ENABLED === 'false';
  checks.push(
    check(
      'analytics-default',
      'Analytics safe default',
      analyticsDisabled ? 'PASS' : 'BLOCKED',
      analyticsDisabled ? 'Analytics Engine collection is disabled in local, staging, and production config.' : 'One or more environments enable analytics without activation evidence.',
      'Complete the analytics activation runbook or restore false defaults.',
    ),
  );

  const newsletterHtml = path.join(root, 'dist', 'newsletter', 'index.html');
  const newsletterEnabled = (await exists(newsletterHtml))
    ? (await fs.readFile(newsletterHtml, 'utf8')).includes('data-newsletter-form')
    : false;
  checks.push(
    check(
      'newsletter-build',
      'Newsletter build state',
      newsletterEnabled ? 'DEFERRED' : 'PASS',
      newsletterEnabled ? 'The current build exposes newsletter signup; provider evidence is required in the release record.' : 'The current build keeps newsletter signup disabled and RSS-first.',
    ),
  );

  const contactHtml = path.join(root, 'dist', 'contact', 'index.html');
  const contactEnabled = (await exists(contactHtml))
    ? (await fs.readFile(contactHtml, 'utf8')).includes('data-contact-form')
    : false;
  checks.push(
    check(
      'contact-build',
      'Contact build state',
      contactEnabled ? 'DEFERRED' : 'PASS',
      contactEnabled ? 'The current build exposes the contact form; delivery evidence is required in the release record.' : 'The current build uses the email-only contact route and does not expose the unverified form.',
    ),
  );

  const founderPath = path.join(root, 'data', 'private', 'founder-evidence.json');
  if (!(await exists(founderPath))) {
    checks.push(check('founder', 'Founder evidence', target === 'production' ? 'BLOCKED' : 'DEFERRED', 'Private founder evidence has not been supplied.', 'Complete data/private/founder-evidence.json and run npm run research:founder.'));
  } else {
    let result;
    try {
      result = validateFounderEvidence(await readJson(founderPath));
    } catch {
      result = { ready: false, errors: ['Unreadable JSON'], missing: [] };
    }
    checks.push(
      check(
        'founder',
        'Founder evidence',
        result.ready ? 'PASS' : target === 'production' ? 'BLOCKED' : 'DEFERRED',
        result.ready ? 'Founder evidence passes the structural copy gate.' : `Founder evidence is incomplete: ${result.errors.length} contract error(s), ${result.missing.length} missing item(s).`,
        'Resolve the private readiness report; human approval remains required.',
      ),
    );
  }

  const legacyPath = path.join(root, 'data', 'private', 'legacy-evidence.json');
  let legacyEvidence = null;
  if (await exists(legacyPath)) {
    try {
      legacyEvidence = await readJson(legacyPath);
    } catch {
      legacyEvidence = null;
    }
  }
  if (!legacyEvidence?.summary || !Array.isArray(legacyEvidence.urls)) {
    checks.push(check('legacy-evidence', 'Private traffic and URL evidence', target === 'production' ? 'BLOCKED' : 'DEFERRED', 'No valid private recovery evidence output is available.', 'Run npm run research:evidence with founder-owned exports.'));
  } else {
    const consequential = legacyEvidence.urls.filter((record) => record.reviewQueue === 'RISK_REVIEW' || record.evidenceScore >= 30);
    const unresolved = consequential.filter((record) => !record.decision || record.decision === 'UNDECIDED');
    checks.push(
      check(
        'legacy-evidence',
        'Private traffic and URL evidence',
        unresolved.length === 0 ? 'PASS' : target === 'production' ? 'BLOCKED' : 'DEFERRED',
        `${consequential.length} consequential URL(s); ${unresolved.length} still undecided.`,
        'Approve risk, P0, and P1 URL decisions before production.',
      ),
    );
  }

  const redirectRules = parseRedirectRules(await fs.readFile(path.join(root, 'public', '_redirects'), 'utf8'));
  if (!legacyEvidence?.urls) {
    checks.push(check('redirects', 'Executable legacy redirects', target === 'production' ? 'BLOCKED' : 'DEFERRED', `${redirectRules.length} redirect rule(s); evidence comparison is unavailable.`, 'Load private recovery evidence before approving redirects.'));
  } else {
    const approved301 = legacyEvidence.urls.filter((record) => record.decision === '301');
    const ruleSet = new Set(redirectRules.map((rule) => `${rule.source} ${rule.destination} ${rule.status}`));
    const missingRules = approved301.filter((record) => !ruleSet.has(`${record.path} ${record.destination} 301`));
    const exact = missingRules.length === 0 && redirectRules.length === approved301.length;
    checks.push(check('redirects', 'Executable legacy redirects', exact ? 'PASS' : target === 'production' ? 'BLOCKED' : 'DEFERRED', `${approved301.length} approved 301 decision(s); ${redirectRules.length} executable rule(s); ${missingRules.length} approved rule(s) missing.`, 'Make public/_redirects exactly match approved 301 decisions.'));
  }

  const releasePath = path.join(root, 'data', 'private', 'release-evidence.json');
  if (!(await exists(releasePath))) {
    checks.push(check('release-evidence', 'Operator release evidence', 'BLOCKED', 'No private release evidence record exists.', 'Complete data/private/release-evidence.json from the versioned example.'));
  } else {
    let result;
    try {
      result = validateReleaseEvidence(await readJson(releasePath), target);
    } catch {
      result = { valid: false, errors: ['Unreadable JSON'], missing: [] };
    }
    checks.push(check('release-evidence', 'Operator release evidence', result.valid ? 'PASS' : 'BLOCKED', result.valid ? `Required ${target} operator attestations and evidence references are present.` : `${result.errors.length} contract error(s); ${result.missing.length} missing attestation(s).`, 'Capture account, route, rollback, integration, staging, and cutover evidence as applicable.'));
  }

  const blocked = checks.filter((item) => item.status === 'BLOCKED').length;
  return {
    schemaVersion: 1,
    target,
    status: blocked === 0 ? 'READY_FOR_NEXT_GATE' : 'BLOCKED',
    blocked,
    deferred: checks.filter((item) => item.status === 'DEFERRED').length,
    passed: checks.filter((item) => item.status === 'PASS').length,
    checks,
  };
}

export function buildPreflightReport(result, checkedAt = new Date().toISOString()) {
  const rows = result.checks
    .map((item) => `| ${item.label} | ${item.status} | ${item.detail.replace(/\|/g, '\\|')} |`)
    .join('\n');
  const actions = result.checks
    .filter((item) => item.status !== 'PASS' && item.nextAction)
    .map((item) => `- **${item.label}:** ${item.nextAction}`)
    .join('\n');
  return `# Harkingbade ${result.target} Launch Preflight\n\n` +
    `Checked: ${checkedAt}\n` +
    `Status: ${result.status}\n` +
    `Summary: ${result.passed} passed, ${result.blocked} blocked, ${result.deferred} deferred.\n\n` +
    `This report contains readiness states and counts only. It does not copy founder evidence, analytics metrics, account identifiers, secret values, contact data, or private evidence references.\n\n` +
    `| Check | Status | Evidence |\n|---|---|---|\n${rows}\n\n` +
    `## Required actions\n\n${actions || '- None.'}\n\n` +
    `A preflight pass authorizes no deployment by itself. Production still requires explicit cutover approval and live post-deploy verification.\n`;
}

function parseArgs(args) {
  const options = { target: 'production', output: null, allowIncomplete: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--target') options.target = args[++index];
    else if (arg === '--output') options.output = args[++index];
    else if (arg === '--allow-incomplete') options.allowIncomplete = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!VALID_TARGETS.has(options.target)) throw new Error('--target must be staging or production.');
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runLaunchPreflight({ target: options.target });
  const output = path.resolve(options.output ?? `docs/private/launch-preflight-${options.target}.md`);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, buildPreflightReport(result), 'utf8');
  console.log(`${options.target} preflight ${result.status.toLowerCase()}: ${result.passed} passed, ${result.blocked} blocked, ${result.deferred} deferred.`);
  console.log(`Privacy-safe report: ${output}`);
  if (result.blocked > 0 && !options.allowIncomplete) process.exitCode = 2;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
