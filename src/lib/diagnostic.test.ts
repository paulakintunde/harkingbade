import { describe, expect, it } from 'vitest';
import { diagnosticQuestions, scoreDiagnostic } from './diagnostic';

const answersAt = (value: number) =>
  Object.fromEntries(diagnosticQuestions.map((question) => [question.id, value]));

describe('4D diagnostic scoring', () => {
  it('scores all stages and identifies the correct band', () => {
    const result = scoreDiagnostic(answersAt(3));
    expect(result.total).toBe(48);
    expect(result.maximum).toBe(80);
    expect(result.band).toBe('Aligned but fragile');
    expect(result.stageScores).toEqual({ discover: 12, define: 12, deliver: 12, drive: 12 });
  });

  it('selects the weakest stage and its actions', () => {
    const answers = answersAt(5);
    for (const question of diagnosticQuestions.filter((question) => question.stage === 'drive')) {
      answers[question.id] = 1;
    }
    const result = scoreDiagnostic(answers);
    expect(result.primaryStage).toBe('drive');
    expect(result.weakestStages).toEqual(['drive']);
    expect(result.actions).toHaveLength(3);
  });

  it('rejects incomplete or out-of-range answers', () => {
    const answers = answersAt(3);
    delete answers[diagnosticQuestions[0]!.id];
    expect(() => scoreDiagnostic(answers)).toThrow('Missing or invalid answer');
  });
});
