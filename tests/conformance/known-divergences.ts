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
 * Snapshot: 27 divergences of 154 corpus cases (Phase 3: 19, Phase 4: 4, Phase 6: 4).
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
    caseId: 'division-by-zero:double-div-zero',
    group: 'division-by-zero',
    expr: '1.0 / 0.0',
    defect: 'D13',
    phase: 'Phase 3',
    spring: 'value null',
    engine: 'throws SpelEvaluationException',
    verdict: 'rejects-valid',
  },
  {
    caseId: 'division-by-zero:int-mod-zero',
    group: 'division-by-zero',
    expr: '1 % 0',
    defect: 'D13',
    phase: 'Phase 3',
    spring: 'throws SpelEvaluationException',
    engine: 'value null',
    verdict: 'accepts-invalid',
  },
  {
    caseId: "equality:0-'1' == 1",
    group: 'equality',
    expr: "'1' == 1",
    defect: 'D6',
    phase: 'Phase 3',
    spring: 'value false',
    engine: 'value true',
    verdict: 'wrong-value',
  },
  {
    caseId: 'equality:1-true == 1',
    group: 'equality',
    expr: 'true == 1',
    defect: 'D6',
    phase: 'Phase 3',
    spring: 'value false',
    engine: 'value true',
    verdict: 'wrong-value',
  },
  {
    caseId: "equality:7-1 != '1'",
    group: 'equality',
    expr: "1 != '1'",
    defect: 'D6',
    phase: 'Phase 3',
    spring: 'value true',
    engine: 'value false',
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
    caseId: 'logical-typing:and-null',
    group: 'logical-typing',
    expr: 'null and true',
    defect: 'D5',
    phase: 'Phase 3',
    spring: 'throws SpelEvaluationException',
    engine: 'value null',
    verdict: 'accepts-invalid',
  },
  {
    caseId: 'logical-typing:and-number',
    group: 'logical-typing',
    expr: 'true and 5',
    defect: 'D5',
    phase: 'Phase 3',
    spring: 'throws SpelEvaluationException',
    engine: 'value 5',
    verdict: 'accepts-invalid',
  },
  {
    caseId: 'logical-typing:and-numbers',
    group: 'logical-typing',
    expr: '1 and 1',
    defect: 'D5',
    phase: 'Phase 3',
    spring: 'throws SpelEvaluationException',
    engine: 'value 1',
    verdict: 'accepts-invalid',
  },
  {
    caseId: 'logical-typing:not-number',
    group: 'logical-typing',
    expr: 'not 5',
    defect: 'D5',
    phase: 'Phase 3',
    spring: 'throws SpelEvaluationException',
    engine: 'value false',
    verdict: 'accepts-invalid',
  },
  {
    caseId: 'logical-typing:or-string',
    group: 'logical-typing',
    expr: "'a' or false",
    defect: 'D5',
    phase: 'Phase 3',
    spring: 'throws SpelEvaluationException',
    engine: 'value "a"',
    verdict: 'accepts-invalid',
  },
  {
    caseId: 'numeric-tower:0-8 / 5',
    group: 'numeric-tower',
    expr: '8 / 5',
    defect: 'D4',
    phase: 'Phase 3',
    spring: 'value 1',
    engine: 'value 1.6',
    verdict: 'wrong-value',
  },
  {
    caseId: 'numeric-tower:1-7 / 2',
    group: 'numeric-tower',
    expr: '7 / 2',
    defect: 'D4',
    phase: 'Phase 3',
    spring: 'value 3',
    engine: 'value 3.5',
    verdict: 'wrong-value',
  },
  {
    caseId: 'numeric-tower:16-2147483647 + 1',
    group: 'numeric-tower',
    expr: '2147483647 + 1',
    defect: 'D4',
    phase: 'Phase 3',
    spring: 'value -2147483648',
    engine: 'value 2147483648',
    verdict: 'wrong-value',
  },
  {
    caseId: 'numeric-tower:2--7 / 2',
    group: 'numeric-tower',
    expr: '-7 / 2',
    defect: 'D4',
    phase: 'Phase 3',
    spring: 'value -3',
    engine: 'value -3.5',
    verdict: 'wrong-value',
  },
  {
    caseId: 'numeric-tower:3-7 / -2',
    group: 'numeric-tower',
    expr: '7 / -2',
    defect: 'D4',
    phase: 'Phase 3',
    spring: 'value -3',
    engine: 'value -3.5',
    verdict: 'wrong-value',
  },
  {
    caseId: 'numeric-tower:4-1 / 3',
    group: 'numeric-tower',
    expr: '1 / 3',
    defect: 'D4',
    phase: 'Phase 3',
    spring: 'value 0',
    engine: 'value 0.3333333333333333',
    verdict: 'wrong-value',
  },
  {
    caseId: 'numeric-tower:5-10 / 4',
    group: 'numeric-tower',
    expr: '10 / 4',
    defect: 'D4',
    phase: 'Phase 3',
    spring: 'value 2',
    engine: 'value 2.5',
    verdict: 'wrong-value',
  },
  {
    caseId: 'numeric-tower:6-8 / 5 % 2',
    group: 'numeric-tower',
    expr: '8 / 5 % 2',
    defect: 'D4',
    phase: 'Phase 3',
    spring: 'value 1',
    engine: 'value 1.6',
    verdict: 'wrong-value',
  },
  {
    caseId: 'numeric-tower:7-5 / 2 * 2',
    group: 'numeric-tower',
    expr: '5 / 2 * 2',
    defect: 'D4',
    phase: 'Phase 3',
    spring: 'value 4',
    engine: 'value 5',
    verdict: 'wrong-value',
  },
];
