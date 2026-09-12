/**
 * Known divergences from Spring — the enumerated remediation backlog.
 *
 * Maintenance
 * -----------
 * The ratchet in conformance.test.ts asserts that this list equals the set of
 * diverging corpus cases exactly. When a phase lands, remove the entries it
 * resolved. When a divergence is discovered, add it and give it an owner in
 * support/ownership.ts. The ratchet failure message prints ready-to-paste
 * entries for anything missing.
 *
 * Why a list rather than skipping the cases
 * -----------------------------------------
 * Every case here is still executed on every run, and its observed outcome is
 * recorded alongside Spring's. Nothing is skipped: the suite stays green
 * because the backlog is enumerated explicitly, not because failures are
 * suppressed. A regression in an unlisted case fails the build immediately.
 *
 * Snapshot: 9 divergences of 165 corpus cases (Phase 3: 1, Phase 4: 4, Phase 6: 4).
 */
export interface KnownDivergence {
  readonly caseId: string;
  readonly group: string;
  readonly expr: string;
  readonly defect: string;
  readonly phase: string;
  /** What Spring does with the expression. */
  readonly spring: string;
  /** What this engine does with it today. */
  readonly engine: string;
  readonly verdict: string;
}

export const KNOWN_DIVERGENCES: readonly KnownDivergence[] = [
  {
    caseId: 'collections:select-last',
    group: 'collections',
    expr: 'items.$[price > 20]',
    defect: 'D35',
    phase: 'Phase 4',
    spring: 'value {"name":"c","price":30}',
    engine: 'value {"name":"b","price":200}',
    verdict: 'wrong-value',
  },
  {
    caseId: 'grammar-strictness:assignment-not-chainable',
    group: 'grammar-strictness',
    expr: '#a = #b = 1',
    defect: 'D12',
    phase: 'Phase 4',
    spring: 'throws SpelParseException',
    engine: 'throws SpelEvaluationException',
    verdict: 'wrong-value',
  },
  {
    caseId: 'grammar-strictness:between-requires-list',
    group: 'grammar-strictness',
    expr: '1 between 1 and 5',
    defect: 'D12',
    phase: 'Phase 4',
    spring: 'throws SpelParseException',
    engine: 'value true',
    verdict: 'accepts-invalid',
  },
  {
    caseId: 'grammar-strictness:double-star-is-not-power',
    group: 'grammar-strictness',
    expr: '2 ** 3',
    defect: 'D12',
    phase: 'Phase 4',
    spring: 'throws SpelParseException',
    engine: 'value 8',
    verdict: 'accepts-invalid',
  },
  {
    caseId: "java-string-methods:0-'abc'.matches('a.*')",
    group: 'java-string-methods',
    expr: "'abc'.matches('a.*')",
    defect: 'D37',
    phase: 'Phase 6',
    spring: 'value true',
    engine: 'throws SpelEvaluationException',
    verdict: 'rejects-valid',
  },
  {
    caseId: "java-string-methods:1-'abc'.matches('b')",
    group: 'java-string-methods',
    expr: "'abc'.matches('b')",
    defect: 'D37',
    phase: 'Phase 6',
    spring: 'value false',
    engine: 'throws SpelEvaluationException',
    verdict: 'rejects-valid',
  },
  {
    caseId: "java-string-methods:12-'a1b2'.replaceAll('\\d', '-')",
    group: 'java-string-methods',
    expr: "'a1b2'.replaceAll('\\d', '-')",
    defect: 'D37',
    phase: 'Phase 6',
    spring: 'value "a-b-"',
    engine: 'value "a1b2"',
    verdict: 'wrong-value',
  },
  {
    caseId: "java-string-methods:7-'abc'.equalsIgnoreCase('ABC')",
    group: 'java-string-methods',
    expr: "'abc'.equalsIgnoreCase('ABC')",
    defect: 'D37',
    phase: 'Phase 6',
    spring: 'value true',
    engine: 'throws SpelEvaluationException',
    verdict: 'rejects-valid',
  },
  {
    caseId: 'long-precision:0-9007199254740993L',
    group: 'long-precision',
    expr: '9007199254740993L',
    defect: 'D38',
    phase: 'Phase 3',
    spring: 'value 9007199254740993n',
    engine: 'value 9007199254740992',
    verdict: 'wrong-value',
  },
];
