import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const EXPECTED_VERSION = 'harkingbade-founder-evidence-v1';
const PRIORITY_KEYS = ['fullTimeRole', 'services', 'digitalProducts', 'publishing'];

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validEmail(value) {
  return hasText(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function addMissing(missing, pathName, message, gate) {
  missing.push({ path: pathName, message, gate });
}

function requireText(missing, value, pathName, message, gate) {
  if (!hasText(value)) addMissing(missing, pathName, message, gate);
}

export function validateFounderEvidence(input) {
  const errors = [];
  const missing = [];

  if (!isObject(input)) {
    return {
      contractValid: false,
      ready: false,
      errors: ['The founder evidence file must contain one JSON object.'],
      missing,
      gates: {},
      approvedProofCount: 0,
    };
  }

  if (input.version !== EXPECTED_VERSION) {
    errors.push(`version must be ${EXPECTED_VERSION}.`);
  }

  const identity = isObject(input.identity) ? input.identity : {};
  requireText(missing, identity.publicName, 'identity.publicName', 'Add the public professional name.', 'identity');
  requireText(missing, identity.professionalTitle, 'identity.professionalTitle', 'Choose the public professional title.', 'identity');
  requireText(missing, identity.location, 'identity.location', 'Add the public location or working region.', 'identity');
  requireText(missing, identity.marketsServed, 'identity.marketsServed', 'Define the markets or geographies served.', 'identity');
  requireText(missing, identity.workingArrangement, 'identity.workingArrangement', 'State the preferred working arrangement.', 'identity');
  if (!validEmail(identity.publicEmail)) {
    addMissing(missing, 'identity.publicEmail', 'Add a valid public contact email.', 'identity');
  }
  requireText(missing, identity.resume, 'identity.resume', 'Add a resume path or verified URL.', 'career');
  requireText(missing, identity.linkedin, 'identity.linkedin', 'Add the verified LinkedIn URL.', 'career');

  const priorities = isObject(input.sixMonthPriorities) ? input.sixMonthPriorities : {};
  const priorityValues = PRIORITY_KEYS.map((key) => priorities[key]);
  if (!priorityValues.every((value) => Number.isInteger(value) && value >= 0 && value <= 100)) {
    errors.push(`sixMonthPriorities must contain integer values from 0 to 100 for: ${PRIORITY_KEYS.join(', ')}.`);
  } else if (priorityValues.reduce((sum, value) => sum + value, 0) !== 100) {
    errors.push('sixMonthPriorities must total exactly 100.');
  }

  const targetRoles = Array.isArray(input.targetRoles) ? input.targetRoles : [];
  if (targetRoles.length === 0) {
    addMissing(missing, 'targetRoles[0]', 'Add at least one anchor role.', 'career');
  } else {
    const anchorRole = targetRoles[0] ?? {};
    requireText(missing, anchorRole.role, 'targetRoles[0].role', 'Name the anchor role.', 'career');
    requireText(missing, anchorRole.employerType, 'targetRoles[0].employerType', 'Define the anchor employer type.', 'career');
    requireText(missing, anchorRole.seniority, 'targetRoles[0].seniority', 'Define the anchor seniority.', 'career');
    requireText(missing, anchorRole.geography, 'targetRoles[0].geography', 'Define the anchor geography.', 'career');
    requireText(missing, anchorRole.evidenceFit, 'targetRoles[0].evidenceFit', 'Explain why the evidence fits the role.', 'career');
  }

  const targetClient = isObject(input.targetClient) ? input.targetClient : {};
  requireText(missing, targetClient.companyStage, 'targetClient.companyStage', 'Define the target company stage or size.', 'services');
  requireText(missing, targetClient.buyerTitle, 'targetClient.buyerTitle', 'Name the target buyer.', 'services');
  requireText(missing, targetClient.expensiveProblem, 'targetClient.expensiveProblem', 'State the expensive problem the buyer recognizes.', 'services');
  requireText(missing, targetClient.urgentTrigger, 'targetClient.urgentTrigger', 'State what makes the problem urgent.', 'services');

  const projects = Array.isArray(input.projects) ? input.projects : [];
  const approvedProjects = projects.filter((project) => {
    if (!isObject(project) || project.approvedForPublicUse !== true) return false;
    const required = [
      project.projectAndOrganization,
      project.datesAndRole,
      project.customerOrUser,
      project.startingSituation,
      project.problemConsequence,
      project.constraints,
      project.evidenceReviewed,
      project.decisionsOwned,
      project.workProduced,
      project.collaborators,
      project.baselineMeasure,
      project.result,
      project.measurementWindow,
      project.dataSource,
      project.artifacts,
      project.contributionBoundary,
      project.confidentialityLimits,
      project.publicClaim,
    ];
    return required.every(hasText);
  });
  if (approvedProjects.length < 3) {
    addMissing(
      missing,
      'projects',
      `Add ${3 - approvedProjects.length} more complete project proof record(s) approved for public use.`,
      'proof',
    );
  }

  const capabilities = Array.isArray(input.capabilities) ? input.capabilities : [];
  const allowedClassifications = new Set(['lead', 'supporting', 'learning', 'not-for-sale']);
  capabilities.forEach((capability, index) => {
    if (isObject(capability) && !allowedClassifications.has(capability.classification)) {
      errors.push(`capabilities[${index}].classification must be lead, supporting, learning, or not-for-sale.`);
    }
  });
  const leadCapabilities = capabilities.filter(
    (capability) =>
      isObject(capability) &&
      capability.classification === 'lead' &&
      hasText(capability.name) &&
      hasText(capability.strongestProof),
  );
  if (leadCapabilities.length < 2) {
    addMissing(missing, 'capabilities', 'Name at least two lead capabilities with proof.', 'positioning');
  }

  const commercial = isObject(input.commercialConstraints) ? input.commercialConstraints : {};
  if (!(Number.isFinite(commercial.hoursPerWeek) && commercial.hoursPerWeek > 0)) {
    addMissing(missing, 'commercialConstraints.hoursPerWeek', 'State available hours per week.', 'services');
  }
  requireText(missing, commercial.currency, 'commercialConstraints.currency', 'Choose the working currency.', 'services');
  if (!(Number.isFinite(commercial.minimumEngagementValue) && commercial.minimumEngagementValue >= 0)) {
    addMissing(missing, 'commercialConstraints.minimumEngagementValue', 'State the minimum engagement value.', 'services');
  }
  if (!(Number.isInteger(commercial.maximumSimultaneousClients) && commercial.maximumSimultaneousClients > 0)) {
    addMissing(missing, 'commercialConstraints.maximumSimultaneousClients', 'State the maximum simultaneous clients.', 'services');
  }

  const gateNames = ['identity', 'career', 'services', 'proof', 'positioning'];
  const gates = Object.fromEntries(
    gateNames.map((gate) => [gate, !missing.some((item) => item.gate === gate)]),
  );
  const contractValid = errors.length === 0;
  const ready = contractValid && Object.values(gates).every(Boolean);

  return {
    contractValid,
    ready,
    errors,
    missing,
    gates,
    approvedProofCount: approvedProjects.length,
  };
}

export function buildReadinessReport(result, checkedAt = new Date().toISOString()) {
  const gateRows = Object.entries(result.gates)
    .map(([gate, passed]) => `| ${gate} | ${passed ? 'READY' : 'NOT READY'} |`)
    .join('\n');
  const errors = result.errors.length
    ? result.errors.map((error) => `- ${error}`).join('\n')
    : '- None.';
  const missing = result.missing.length
    ? result.missing.map((item) => `- \`${item.path}\` (${item.gate}): ${item.message}`).join('\n')
    : '- None.';

  return `# Founder Evidence Readiness\n\n` +
    `Checked: ${checkedAt}\n` +
    `Overall: ${result.ready ? 'READY FOR FOUNDER COPY GATE' : 'NOT READY'}\n` +
    `Approved complete proof records: ${result.approvedProofCount}\n\n` +
    `This report contains readiness results only. It deliberately does not copy identity, contact, employment, client, or project values from the private input.\n\n` +
    `## Gates\n\n| Gate | Status |\n|---|---|\n${gateRows}\n\n` +
    `## Contract errors\n\n${errors}\n\n` +
    `## Missing evidence\n\n${missing}\n`;
}

function parseArgs(args) {
  const options = {
    input: 'data/private/founder-evidence.json',
    output: 'docs/private/founder-evidence-readiness.md',
    allowIncomplete: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') options.input = args[++index];
    else if (arg === '--output') options.output = args[++index];
    else if (arg === '--allow-incomplete') options.allowIncomplete = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(options.input);
  const outputPath = path.resolve(options.output);
  const raw = await fs.readFile(inputPath, 'utf8');
  const input = JSON.parse(raw);
  const result = validateFounderEvidence(input);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buildReadinessReport(result), 'utf8');
  console.log(
    `Founder evidence ${result.ready ? 'ready' : 'not ready'}: ${result.approvedProofCount} approved proof record(s); ${result.errors.length} contract error(s); ${result.missing.length} missing item(s).`,
  );
  console.log(`Privacy-safe readiness report: ${outputPath}`);
  if (!result.ready && !options.allowIncomplete) process.exitCode = 2;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
