import { describe, expect, it } from 'vitest';
import { parseRedirectRules, validateReleaseEvidence } from './launch-preflight.mjs';

function completeReleaseEvidence() {
  return {
    version: 'harkingbade-release-evidence-v1',
    operator: 'Release owner',
    reviewedAt: '2026-08-16T12:00:00Z',
    cloudflare: {
      accountAndZoneConfirmed: true,
      accountAndZoneEvidence: 'private/account-check.md',
      currentRouteInspected: true,
      rollbackSnapshotCaptured: true,
      rollbackSnapshotReference: 'private/rollback.md',
    },
    staging: {
      url: 'https://staging.example.workers.dev',
      smokePassed: true,
      noindexVerified: true,
      evidenceReference: 'private/staging.md',
    },
    contact: {
      launchMode: 'email-only',
      publicAddressVerified: true,
      pageUpdatedForMode: true,
    },
    newsletter: { launchMode: 'disabled' },
    search: { searchConsoleOwnershipVerified: true, sitemapSubmissionReady: true },
    performance: { stagingTraceRecorded: true, evidenceReference: 'private/performance.md' },
    cutover: { windowApproved: true, rollbackOwner: 'Release owner' },
  };
}

describe('launch preflight', () => {
  it('parses executable redirects and ignores comments', () => {
    expect(parseRedirectRules('# note\n/old/ /new/ 301\n\n')).toEqual([
      { source: '/old/', destination: '/new/', status: '301' },
    ]);
  });

  it('accepts a complete production evidence record', () => {
    const result = validateReleaseEvidence(completeReleaseEvidence(), 'production');
    expect(result).toEqual({ valid: true, missing: [], errors: [] });
  });

  it('keeps staging preflight limited to account, route, and rollback evidence', () => {
    const input: Record<string, unknown> = completeReleaseEvidence();
    delete input.staging;
    delete input.contact;
    delete input.newsletter;
    delete input.search;
    delete input.performance;
    delete input.cutover;
    expect(validateReleaseEvidence(input, 'staging').valid).toBe(true);
  });

  it('blocks production when integration and staging proof are absent', () => {
    const input: Record<string, unknown> = completeReleaseEvidence();
    delete input.staging;
    input.contact = { launchMode: 'webhook' };
    const result = validateReleaseEvidence(input, 'production');
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('staging.smokePassed');
    expect(result.missing).toContain('contact.productionDeliveryVerified');
  });
});
