/**
 * Spring conformance suite.
 *
 * Two layers, and nothing is skipped:
 *
 *  1. Strict tests — every corpus case not recorded in `known-divergences.ts`
 *     must match Spring exactly. These are the regression guards: they fail on
 *     any drift, including drift introduced by a future change.
 *
 *  2. Backlog ratchet — the set of diverging cases must equal the recorded
 *     backlog. A new divergence fails the build, so drift cannot be absorbed
 *     silently. A recorded case that starts conforming also fails the build, so
 *     the backlog has to be tightened in the same change that fixes it rather
 *     than being left to rot.
 *
 * The corpus is the executable definition of "correct": each case cites the
 * Spring source that justifies its expectation. Coverage alone cannot detect a
 * semantic divergence, which is why this suite measures conformance instead.
 */
import { describe, expect, it } from 'vitest';
import { CORPUS } from './corpus.js';
import { KNOWN_DIVERGENCES } from './known-divergences.js';
import { runCorpus, summarise } from './run-corpus.js';
import type { CaseResult } from './run-corpus.js';
import { ownershipOf } from './support/ownership.js';
import {
  describeExpected,
  describeOutcome,
  renderBaselineEntry,
  renderDivergenceTable,
} from './support/report.js';

const results = runCorpus(CORPUS);
const backlog = new Map(KNOWN_DIVERGENCES.map((entry) => [entry.caseId, entry]));
const divergences = results.filter((result) => result.verdict !== 'match');
const divergingIds = new Set(divergences.map((result) => result.testCase.id));
const summary = summarise(results);

/**
 * Backlog size per remediation phase. Surfaced in a test name so the CI log
 * shows progress; the test tsconfig declares no DOM or Node lib, so writing to
 * a stream is not available here.
 */
const phaseBreakdown = [...new Set(KNOWN_DIVERGENCES.map((entry) => entry.phase))]
  .sort((left, right) => left.localeCompare(right))
  .map((phase) => `${phase}:${KNOWN_DIVERGENCES.filter((entry) => entry.phase === phase).length}`)
  .join(' ');

function failureReport(result: CaseResult): string {
  const entry = backlog.get(result.testCase.id);
  return [
    '',
    `expression : ${result.testCase.expr}`,
    `spring     : ${describeExpected(result)}`,
    `engine     : ${describeOutcome(result)}`,
    `verdict    : ${result.verdict}`,
    `reference  : ${result.testCase.ref}`,
    entry === undefined
      ? 'backlog    : NOT RECORDED — this is a new divergence or a regression.'
      : `backlog    : ${entry.defect} (${entry.phase})`,
  ].join('\n  ');
}

// ---------------------------------------------------------------------------
// 1. Strict conformance
// ---------------------------------------------------------------------------

for (const group of [...new Set(CORPUS.map((testCase) => testCase.group))]) {
  const strict = results.filter(
    (result) => result.testCase.group === group && !backlog.has(result.testCase.id),
  );
  if (strict.length === 0) {
    continue;
  }

  describe(group, () => {
    for (const result of strict) {
      it(`${result.testCase.id} :: ${result.testCase.expr}`, () => {
        expect(result.verdict, failureReport(result)).toBe('match');
      });
    }
  });
}

// ---------------------------------------------------------------------------
// 2. Backlog ratchet
// ---------------------------------------------------------------------------

describe('divergence backlog', () => {
  it('classifies every diverging group against a defect and a phase', () => {
    const unclassified = [...new Set(divergences.map((result) => result.testCase.group))].filter(
      (group) => ownershipOf(group) === undefined,
    );
    expect(
      unclassified,
      'A new class of divergence appeared. Classify it in tests/conformance/support/ownership.ts ' +
        'against a defect id and a remediation phase before accepting it into the backlog.',
    ).toEqual([]);
  });

  it('records every observed divergence', () => {
    const unrecorded = divergences
      .filter((result) => !backlog.has(result.testCase.id))
      .map((result) => {
        const owner = ownershipOf(result.testCase.group);
        return renderBaselineEntry(
          result,
          owner?.defect ?? 'UNCLASSIFIED',
          owner?.phase ?? 'UNCLASSIFIED',
        );
      });

    expect(
      unrecorded,
      `${unrecorded.length} divergence(s) are not in known-divergences.ts. ` +
        'If these are newly discovered, add them with their defect id; if they are regressions, ' +
        'fix them.\n\n' +
        unrecorded.join('\n'),
    ).toEqual([]);
  });

  it('records no divergence that has been resolved', () => {
    const resolved = KNOWN_DIVERGENCES.filter((entry) => !divergingIds.has(entry.caseId)).map(
      (entry) => `  ${entry.caseId}  (${entry.defect}, ${entry.phase})  ${entry.expr}`,
    );

    expect(
      resolved,
      `${resolved.length} recorded divergence(s) now conform. Remove them from ` +
        'known-divergences.ts so the ratchet tightens.\n\n' +
        resolved.join('\n'),
    ).toEqual([]);
  });

  it('references only corpus cases that exist', () => {
    const corpusIds = new Set(CORPUS.map((testCase) => testCase.id));
    const stale = KNOWN_DIVERGENCES.filter((entry) => !corpusIds.has(entry.caseId)).map(
      (entry) => entry.caseId,
    );
    expect(
      stale,
      'These recorded divergences reference corpus cases that no longer exist.',
    ).toEqual([]);
  });

  it('attributes every recorded divergence to a defect and a phase', () => {
    const unattributed = KNOWN_DIVERGENCES.filter(
      (entry) => entry.defect.trim() === '' || entry.phase.trim() === '',
    ).map((entry) => entry.caseId);
    expect(unattributed, 'Every divergence needs an owner.').toEqual([]);
  });

  it(`balances the ledger (${summary.byVerdict.match} match, ${summary.divergences} diverging)`, () => {
    expect(summary.byVerdict.match + summary.divergences).toBe(summary.total);
  });

  it(`records ${KNOWN_DIVERGENCES.length} divergences across ${phaseBreakdown}`, () => {
    expect(KNOWN_DIVERGENCES, renderDivergenceTable(results)).toHaveLength(summary.divergences);
    expect(new Set(KNOWN_DIVERGENCES.map((entry) => entry.caseId))).toEqual(divergingIds);
  });
});
