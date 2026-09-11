/**
 * Conformance runner — executes the corpus against the engine and classifies
 * every outcome. Deliberately free of any test-framework dependency so the same
 * engine can back a vitest suite, a `node:test` suite, or a CLI reporter.
 */
import { SpelExpressionParser } from '../../src/spel-expression-parser.js';
import { StandardEvaluationContext } from '../../src/standard-evaluation-context.js';
import type { ConformanceCase } from './corpus.js';

export type Outcome =
  | { readonly kind: 'value'; readonly value: unknown }
  | { readonly kind: 'throws'; readonly errorName: string; readonly message: string };

export type Verdict =
  /** The engine agrees with Spring. */
  | 'match'
  /** Spring accepts the expression; the engine throws. */
  | 'rejects-valid'
  /** The engine accepts an expression Spring rejects. */
  | 'accepts-invalid'
  /** Both accept it, but the engine returns a different value. */
  | 'wrong-value';

export interface CaseResult {
  readonly testCase: ConformanceCase;
  readonly outcome: Outcome;
  readonly verdict: Verdict;
}

const parser = new SpelExpressionParser();

export function evaluateExpression(
  expr: string,
  root?: Record<string, unknown>,
  variables?: Record<string, unknown>,
): Outcome {
  try {
    const ast = parser.parseExpression(expr);
    const context = new StandardEvaluationContext(root ?? {});
    for (const [name, value] of Object.entries(variables ?? {})) {
      context.setVariable(name, value);
    }
    return { kind: 'value', value: ast.getValueWithContext(context) };
  } catch (error) {
    const err = error as Error;
    return { kind: 'throws', errorName: err.constructor.name, message: err.message };
  }
}

/**
 * Structural equality over the value shapes SpEL can produce: primitives,
 * arrays and plain objects. Primitives use Object.is so that -0, NaN and
 * Infinity are distinguished rather than silently coerced.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (a === null || b === null || typeof a !== 'object') {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const aKeys = Object.keys(ao);
  const bKeys = Object.keys(bo);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every((k) => Object.prototype.hasOwnProperty.call(bo, k) && deepEqual(ao[k], bo[k]));
}

export function classify(testCase: ConformanceCase, outcome: Outcome): Verdict {
  const expected = testCase.expect;

  if (expected.kind === 'throws') {
    if (outcome.kind === 'throws') {
      return outcome.errorName === expected.errorName
        ? 'match'
        : // Still divergent: Spring raises a different category of failure.
          'wrong-value';
    }
    return 'accepts-invalid';
  }

  if (outcome.kind === 'throws') {
    return 'rejects-valid';
  }

  return deepEqual(outcome.value, expected.value) ? 'match' : 'wrong-value';
}

export function runCase(testCase: ConformanceCase): CaseResult {
  const outcome = evaluateExpression(testCase.expr, testCase.root, testCase.variables);
  return { testCase, outcome, verdict: classify(testCase, outcome) };
}

export function runCorpus(cases: readonly ConformanceCase[]): CaseResult[] {
  return cases.map(runCase);
}

export function summarise(results: readonly CaseResult[]): {
  total: number;
  divergences: number;
  byVerdict: Record<Verdict, number>;
  byGroup: Record<string, number>;
} {
  const byVerdict: Record<Verdict, number> = {
    match: 0,
    'rejects-valid': 0,
    'accepts-invalid': 0,
    'wrong-value': 0,
  };
  const byGroup: Record<string, number> = {};

  for (const r of results) {
    byVerdict[r.verdict] += 1;
    if (r.verdict !== 'match') {
      byGroup[r.testCase.group] = (byGroup[r.testCase.group] ?? 0) + 1;
    }
  }

  return {
    total: results.length,
    divergences: results.length - byVerdict.match,
    byVerdict,
    byGroup,
  };
}
