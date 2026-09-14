/**
 * Contract tests for numeric wrapper method invocation.
 *
 * Java's `long` arrives here as a BigInt, and every helper that touches a value carries a
 * separate path for it: `requireNumber` converts, `toTruncatedBigInt` keeps it exact,
 * `longValue` takes its low 64 bits, and `equals` compares without going through a double.
 * Those paths are what the primitive types exist to preserve, so they are asserted directly
 * rather than left to whatever a whole-expression test happens to exercise.
 *
 * The narrowing methods are asserted against Java's own definitions rather than a clamp: a
 * byte keeps the low eight bits, so 200 narrows to -56.
 */
import { describe, expect, it } from 'vitest';
import { SpelEvaluationException } from '../../src/error/spel-evaluation-exception.js';
import { invokeNumberMethod } from '../../src/evaluation-context/java-number-methods.js';

/** Invoke a method and unwrap the value, failing the test on an unknown name. */
function call(target: number | bigint, name: string, ...args: unknown[]): unknown {
  const result = invokeNumberMethod(target, name, args);
  expect(result, `${name} should be a numeric wrapper method`).not.toBeNull();
  return result?.getValue();
}

describe('invokeNumberMethod - lookups', () => {
  it('reports an unknown name so the caller can fail the lookup', () => {
    expect(invokeNumberMethod(1, 'toUpperCase', [])).toBeNull();
  });

  it('renders the value as a string', () => {
    expect(call(12, 'toString')).toBe('12');
    expect(call(12n, 'toString')).toBe('12');
  });
});

describe('invokeNumberMethod - narrowing keeps the low bits', () => {
  it('wraps rather than clamps, as Java does', () => {
    expect(call(200, 'byteValue')).toBe(-56);
    expect(call(65536, 'shortValue')).toBe(0);
    expect(call(2 ** 31, 'intValue')).toBe(-(2 ** 31));
  });

  it('narrows a BigInt the same way', () => {
    expect(call(200n, 'byteValue')).toBe(-56);
    expect(call(2n ** 31n, 'intValue')).toBe(-(2 ** 31));
  });
});

describe('invokeNumberMethod - widening', () => {
  it('truncates a number towards zero', () => {
    expect(call(3.9, 'longValue')).toBe(3);
    expect(call(-3.9, 'longValue')).toBe(-3);
  });

  it('takes the low 64 bits of a BigInt for longValue', () => {
    expect(call(2n ** 63n, 'longValue')).toBe(-(2 ** 63));
    expect(call(7n, 'longValue')).toBe(7);
  });

  it('narrows through a float32 for floatValue', () => {
    expect(call(0.1, 'floatValue')).toBe(Math.fround(0.1));
    expect(call(5n, 'floatValue')).toBe(5);
  });

  it('converts a BigInt for doubleValue', () => {
    expect(call(5n, 'doubleValue')).toBe(5);
  });

  it('rejects a target that is not a number', () => {
    expect(() => invokeNumberMethod('x' as unknown as number, 'doubleValue', [])).toThrow(
      SpelEvaluationException,
    );
  });
});

describe('invokeNumberMethod - equality and ordering', () => {
  it('equals is false for an argument that is not a number', () => {
    expect(call(1, 'equals', '1')).toBe(false);
    expect(call(1, 'equals', null)).toBe(false);
  });

  it('compares numbers directly and BigInts exactly', () => {
    expect(call(1, 'equals', 1)).toBe(true);
    expect(call(1, 'equals', 2)).toBe(false);
    expect(call(1n, 'equals', 1)).toBe(true);
    expect(call(1n, 'equals', 2n)).toBe(false);
  });

  it('returns -1, 0 or 1 from compareTo', () => {
    expect(call(1, 'compareTo', 2)).toBe(-1);
    expect(call(2, 'compareTo', 2)).toBe(0);
    expect(call(3, 'compareTo', 2)).toBe(1);
  });
});
