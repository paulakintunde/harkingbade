import { describe, expect, it } from 'vitest';
import { buildReadinessReport, validateFounderEvidence } from './validate-founder-evidence.mjs';

function completeEvidence() {
  const project = (number: number) => ({
    projectAndOrganization: `Project ${number}`,
    datesAndRole: '2025 / Product lead',
    customerOrUser: 'Target customer.',
    startingSituation: 'The starting situation.',
    problemConsequence: 'The cost of the problem.',
    constraints: 'Time and capacity constraints.',
    evidenceReviewed: 'Interviews and analytics.',
    decisionsOwned: 'The consequential decisions.',
    workProduced: 'The work personally produced.',
    collaborators: 'Solo project.',
    baselineMeasure: 'Baseline measure.',
    result: 'Measured result.',
    measurementWindow: '90 days.',
    dataSource: 'Analytics export.',
    artifacts: 'Dated launch and analytics files.',
    contributionBoundary: 'Founder contribution only.',
    confidentialityLimits: 'Approved summary only.',
    publicClaim: 'Approved public claim.',
    approvedForPublicUse: true,
  });

  return {
    version: 'harkingbade-founder-evidence-v1',
    identity: {
      publicName: 'Founder Name',
      professionalTitle: 'Product & Growth Systems Builder',
      location: 'Vancouver, Canada',
      marketsServed: 'Canada and remote teams',
      workingArrangement: 'Remote or hybrid',
      publicEmail: 'hello@example.com',
      resume: 'https://example.com/resume',
      linkedin: 'https://linkedin.com/in/example',
    },
    sixMonthPriorities: { fullTimeRole: 50, services: 35, digitalProducts: 10, publishing: 5 },
    targetRoles: [{
      role: 'Growth Product Manager',
      employerType: 'Product company',
      seniority: 'Senior',
      geography: 'Canada remote',
      evidenceFit: 'Cross-functional proof.',
    }],
    targetClient: {
      companyStage: 'Seed to Series B',
      buyerTitle: 'Founder or product leader',
      expensiveProblem: 'Unclear product-to-market path',
      urgentTrigger: 'Launch or stalled growth',
    },
    projects: [project(1), project(2), project(3)],
    capabilities: [
      { name: 'Product strategy', classification: 'lead', strongestProof: 'Project 1' },
      { name: 'Growth systems', classification: 'lead', strongestProof: 'Project 2' },
    ],
    commercialConstraints: {
      hoursPerWeek: 15,
      currency: 'CAD',
      minimumEngagementValue: 2500,
      maximumSimultaneousClients: 2,
    },
  };
}

describe('founder evidence readiness', () => {
  it('passes only when every founder-copy gate has evidence', () => {
    const result = validateFounderEvidence(completeEvidence());
    expect(result.ready).toBe(true);
    expect(result.approvedProofCount).toBe(3);
    expect(result.missing).toEqual([]);
  });

  it('rejects a priority allocation that does not total 100', () => {
    const input = completeEvidence();
    input.sixMonthPriorities.fullTimeRole = 40;
    const result = validateFounderEvidence(input);
    expect(result.contractValid).toBe(false);
    expect(result.errors).toContain('sixMonthPriorities must total exactly 100.');
  });

  it('does not count unapproved or incomplete project claims as proof', () => {
    const input = completeEvidence();
    input.projects[0]!.approvedForPublicUse = false;
    input.projects[1]!.dataSource = '';
    const result = validateFounderEvidence(input);
    expect(result.gates.proof).toBe(false);
    expect(result.approvedProofCount).toBe(1);
  });

  it('keeps private source values out of the readiness report', () => {
    const input = completeEvidence();
    const result = validateFounderEvidence(input);
    const report = buildReadinessReport(result, '2026-08-16T00:00:00.000Z');
    expect(report).not.toContain(input.identity.publicName);
    expect(report).not.toContain(input.identity.publicEmail);
    expect(report).not.toContain(input.projects[0]!.publicClaim);
  });
});
