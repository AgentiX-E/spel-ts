/**
 * Formatting helpers shared by the conformance suite.
 *
 * Kept separate so the assertion messages, the console ledger and the
 * baseline-regeneration instructions all describe a case the same way.
 */
import type { CaseResult } from '../run-corpus.js';

/** What Spring is expected to do with the expression. */
export function describeExpected(result: CaseResult): string {
  const { expect } = result.testCase;
  return expect.kind === 'value'
    ? `value ${JSON.stringify(expect.value)}`
    : `throws ${expect.errorName}`;
}

/** What this engine actually did with the expression. */
export function describeOutcome(result: CaseResult): string {
  const { outcome } = result;
  return outcome.kind === 'value'
    ? `value ${JSON.stringify(outcome.value)}`
    : `throws ${outcome.errorName}: ${outcome.message}`;
}

/** A single entry, formatted as the source text needed to record it. */
export function renderBaselineEntry(result: CaseResult, defect: string, phase: string): string {
  const quote = (text: string): string => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  return [
    '  {',
    `    caseId: ${quote(result.testCase.id)},`,
    `    group: ${quote(result.testCase.group)},`,
    `    expr: ${quote(result.testCase.expr)},`,
    `    defect: ${quote(defect)},`,
    `    phase: ${quote(phase)},`,
    `    spring: ${quote(describeExpected(result))},`,
    `    engine: ${quote(describeOutcome(result))},`,
    `    verdict: ${quote(result.verdict)},`,
    '  },',
  ].join('\n');
}

export function padRight(text: string, width: number): string {
  return text.length > width ? `${text.slice(0, width - 1)}…` : text.padEnd(width);
}

/** Human-readable divergence ledger, printed so CI logs carry the delta. */
export function renderDivergenceTable(results: readonly CaseResult[]): string {
  const divergences = results.filter((result) => result.verdict !== 'match');
  if (divergences.length === 0) {
    return '\nconformance: no divergences — the engine matches Spring on every corpus case.\n';
  }

  const widths = [28, 42, 32, 32, 16] as const;
  const rule = '-'.repeat(widths.reduce((total, width) => total + width, 0) + 20);
  const rows = divergences.map((result) => {
    const cells = [
      result.testCase.group,
      result.testCase.expr,
      describeExpected(result),
      describeOutcome(result),
      result.verdict,
    ];
    return cells.map((cell, index) => padRight(cell, widths[index]!)).join('| ');
  });

  const header = ['GROUP', 'EXPRESSION', 'SPRING', 'ENGINE', 'VERDICT']
    .map((cell, index) => padRight(cell, widths[index]!))
    .join('| ');

  return ['', rule, header, rule, ...rows, rule, ''].join('\n');
}
