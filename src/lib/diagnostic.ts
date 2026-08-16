export type DiagnosticStage = 'discover' | 'define' | 'deliver' | 'drive';

export type DiagnosticQuestion = {
  id: string;
  stage: DiagnosticStage;
  prompt: string;
  evidenceHint: string;
};

export const stageMeta: Record<
  DiagnosticStage,
  { number: string; name: string; description: string; actions: string[] }
> = {
  discover: {
    number: '01',
    name: 'Discover',
    description: 'Customer, market, problem, and baseline evidence.',
    actions: [
      'Interview five people in the target situation and preserve their exact language.',
      'Audit behavioural evidence from analytics, support, sales, search, and existing journeys.',
      'Write one bounded opportunity statement separating observations from assumptions.',
    ],
  },
  define: {
    number: '02',
    name: 'Define',
    description: 'Priority, positioning, offer, ownership, and measures.',
    actions: [
      'Choose one primary customer, moment, problem, and alternative to compete against.',
      'Write the promise, proof, exclusions, and success measure in language the team can repeat.',
      'Record the priority decision, decision owner, tradeoffs, and explicit not-now list.',
    ],
  },
  deliver: {
    number: '03',
    name: 'Deliver',
    description: 'Experience, scope, implementation, launch, and instrumentation.',
    actions: [
      'Map the shortest journey from promise to first customer value and remove avoidable handoffs.',
      'Define the smallest release that can test the riskiest assumption without faking completeness.',
      'Instrument the critical behaviour and verify ownership before launch.',
    ],
  },
  drive: {
    number: '04',
    name: 'Drive',
    description: 'Distribution, conversion, retention, experiments, and learning cadence.',
    actions: [
      'Choose one repeatable distribution route matched to where the target audience already acts.',
      'Define activation, conversion, retention, and the evidence threshold for the next decision.',
      'Run one ranked experiment at a time and keep a dated decision record.',
    ],
  },
};

export const diagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: 'discover-customer',
    stage: 'discover',
    prompt: 'We can name one primary customer and the situation that makes this problem urgent.',
    evidenceHint: 'Not a broad demographic: a specific person, context, trigger, and desired change.',
  },
  {
    id: 'discover-recency',
    stage: 'discover',
    prompt: 'Important product and message decisions use recent first-hand customer evidence.',
    evidenceHint: 'Interviews, observation, support, sales, behaviour, or comparable direct evidence.',
  },
  {
    id: 'discover-alternatives',
    stage: 'discover',
    prompt: 'We understand what customers do today and why those alternatives remain acceptable.',
    evidenceHint: 'Include manual work, delay, workarounds, competitors, and doing nothing.',
  },
  {
    id: 'discover-baseline',
    stage: 'discover',
    prompt: 'We have a trustworthy baseline for the behaviour or business outcome we want to change.',
    evidenceHint: 'A defined measure, source, time window, population, and known limitations.',
  },
  {
    id: 'define-priority',
    stage: 'define',
    prompt: 'The team agrees on the most important decision and what is deliberately not a priority.',
    evidenceHint: 'A real tradeoff, not a list in which everything is urgent.',
  },
  {
    id: 'define-position',
    stage: 'define',
    prompt: 'The target customer can understand the promise, difference, and proof without explanation.',
    evidenceHint: 'Validated customer language, not only internal brand vocabulary.',
  },
  {
    id: 'define-offer',
    stage: 'define',
    prompt: 'The product or offer has clear scope, exclusions, value, and a credible reason to act now.',
    evidenceHint: 'What someone gets, what they do not get, for whom, and why the timing matters.',
  },
  {
    id: 'define-measure',
    stage: 'define',
    prompt: 'Success, failure, decision rights, and the evidence gate are defined before execution.',
    evidenceHint: 'Owner, threshold, measurement window, and what happens after each result.',
  },
  {
    id: 'deliver-journey',
    stage: 'deliver',
    prompt: 'The critical experience keeps the product promise from first touch to first value.',
    evidenceHint: 'Message, interaction, fulfilment, support, and operational reality agree.',
  },
  {
    id: 'deliver-scope',
    stage: 'deliver',
    prompt: 'The current scope tests the highest-risk assumption with the least avoidable work.',
    evidenceHint: 'A learning release, not merely a smaller feature list.',
  },
  {
    id: 'deliver-ownership',
    stage: 'deliver',
    prompt: 'Dependencies, decisions, handoffs, quality standards, and owners are explicit.',
    evidenceHint: 'Nothing critical depends on an unnamed person or invisible process.',
  },
  {
    id: 'deliver-instrumentation',
    stage: 'deliver',
    prompt: 'Instrumentation and operational verification are part of the release definition.',
    evidenceHint: 'Events, logs, baselines, error paths, consent, and data quality are tested.',
  },
  {
    id: 'drive-distribution',
    stage: 'drive',
    prompt: 'One repeatable distribution route connects the product to a qualified audience.',
    evidenceHint: 'A channel matched to real audience behaviour, ownership, and capacity.',
  },
  {
    id: 'drive-funnel',
    stage: 'drive',
    prompt: 'We can locate the largest meaningful break across attention, activation, conversion, or retention.',
    evidenceHint: 'Segmented behavioural evidence rather than a site-wide average.',
  },
  {
    id: 'drive-experiments',
    stage: 'drive',
    prompt: 'Experiments are ranked by evidence, expected value, effort, and decision usefulness.',
    evidenceHint: 'A hypothesis and decision rule, not a collection of disconnected tactics.',
  },
  {
    id: 'drive-cadence',
    stage: 'drive',
    prompt: 'The team reviews evidence on a reliable cadence and changes direction when required.',
    evidenceHint: 'Dated decisions, owners, outcomes, and retired assumptions.',
  },
];

export type DiagnosticResult = {
  total: number;
  maximum: number;
  band: 'Unclear' | 'Fragmented' | 'Aligned but fragile' | 'Compounding';
  interpretation: string;
  stageScores: Record<DiagnosticStage, number>;
  weakestStages: DiagnosticStage[];
  primaryStage: DiagnosticStage;
  actions: string[];
};

export function scoreDiagnostic(answers: Record<string, number>): DiagnosticResult {
  const stageScores: Record<DiagnosticStage, number> = {
    discover: 0,
    define: 0,
    deliver: 0,
    drive: 0,
  };

  for (const question of diagnosticQuestions) {
    const answer = answers[question.id];
    if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 1 || answer > 5) {
      throw new Error(`Missing or invalid answer for ${question.id}.`);
    }
    stageScores[question.stage] += answer;
  }

  const total = Object.values(stageScores).reduce((sum, score) => sum + score, 0);
  const minimumStage = Math.min(...Object.values(stageScores));
  const weakestStages = (Object.keys(stageScores) as DiagnosticStage[]).filter(
    (stage) => stageScores[stage] === minimumStage,
  );
  const primaryStage = weakestStages[0] ?? 'discover';
  let band: DiagnosticResult['band'];
  let interpretation: string;

  if (total <= 31) {
    band = 'Unclear';
    interpretation =
      'The system lacks enough shared evidence and decisions for execution or growth activity to compound reliably.';
  } else if (total <= 47) {
    band = 'Fragmented';
    interpretation =
      'Useful work exists, but gaps between evidence, choices, delivery, and growth are likely creating rework or weak demand.';
  } else if (total <= 63) {
    band = 'Aligned but fragile';
    interpretation =
      'The operating logic is visible, but one or more stages depend on assumptions, inconsistent execution, or weak measurement.';
  } else {
    band = 'Compounding';
    interpretation =
      'The system appears connected. The priority is protecting evidence quality and improving the weakest stage without adding unnecessary process.';
  }

  return {
    total,
    maximum: diagnosticQuestions.length * 5,
    band,
    interpretation,
    stageScores,
    weakestStages,
    primaryStage,
    actions: stageMeta[primaryStage].actions,
  };
}
