/**
 * Contract tests for the Java numeric model.
 *
 * These exercise the module directly rather than only through the parser,
 * because several kinds are hard to reach from an expression alone: `float`
 * rounding and `long` wrapping need values that a small corpus would not
 * naturally produce, and leaving them untested would leave the model's most
 * subtle rules unverified.
 */
import { describe, expect, it } from 'vitest';
import { SpelEvaluationException } from '../../src/error/spel-evaluation-exception.js';
import {
  add,
  divide,
  inferKind,
  compareNumericValues,
  isIntegral,
  longLiteralKind,
  multiply,
  negate,
  numericOf,
  numericOperand,
  power,
  promote,
  remainder,
  subtract,
  type Numeric,
} from '../../src/type/numeric.js';

const int = (value: number): Numeric => ({ value, kind: 'int' });
const long = (value: number): Numeric => ({ value, kind: 'long' });
const float = (value: number): Numeric => ({ value, kind: 'float' });
const double = (value: number): Numeric => ({ value, kind: 'double' });

describe('promote', () => {
  it('widens to the larger kind', () => {
    expect(promote('int', 'double')).toBe('double');
    expect(promote('double', 'int')).toBe('double');
    expect(promote('int', 'long')).toBe('long');
    expect(promote('long', 'float')).toBe('float');
    expect(promote('float', 'double')).toBe('double');
  });

  it('keeps a kind when both operands agree', () => {
    expect(promote('int', 'int')).toBe('int');
    expect(promote('float', 'float')).toBe('float');
  });
});

describe('isIntegral', () => {
  it('identifies the integral kinds', () => {
    expect(isIntegral('int')).toBe(true);
    expect(isIntegral('long')).toBe(true);
    expect(isIntegral('float')).toBe(false);
    expect(isIntegral('double')).toBe(false);
  });
});

describe('inferKind', () => {
  it('treats integral values as int', () => {
    expect(inferKind(7)).toBe('int');
    expect(inferKind(0)).toBe('int');
    expect(inferKind(-3)).toBe('int');
  });

  it('treats fractional values as double', () => {
    expect(inferKind(1.5)).toBe('double');
    expect(inferKind(-0.25)).toBe('double');
  });
});

describe('longLiteralKind', () => {
  it('types a suffixed literal as long whatever its magnitude', () => {
    // Unlike an unsuffixed literal, whose kind follows its size: typing `1L` as
    // `int` makes `2147483647L + 1L` wrap at 32 bits.
    expect(longLiteralKind(1)).toBe('long');
    expect(longLiteralKind(2147483647)).toBe('long');
    expect(longLiteralKind(2147483648)).toBe('long');
  });

  it('types a suffixed literal a JavaScript number cannot hold as bigint', () => {
    expect(longLiteralKind(9007199254740993n)).toBe('bigint');
  });
});

describe('numericOf', () => {
  it('respects an explicit kind', () => {
    expect(numericOf(1.5, 'float')).toEqual({ value: 1.5, kind: 'float' });
  });

  it('infers the kind when none is given', () => {
    expect(numericOf(3)).toEqual({ value: 3, kind: 'int' });
    expect(numericOf(3.5)).toEqual({ value: 3.5, kind: 'double' });
  });
});

describe('add', () => {
  it('adds ints and wraps at 32 bits', () => {
    expect(add(int(2), int(3))).toEqual({ value: 5, kind: 'int' });
    expect(add(int(2147483647), int(1))).toEqual({ value: -2147483648, kind: 'int' });
  });

  it('adds longs and wraps at 64 bits', () => {
    expect(add(long(2), long(3))).toEqual({ value: 5, kind: 'long' });
  });

  it('rounds float results to 32 bits', () => {
    expect(add(float(0.1), float(0.2))).toEqual({ value: Math.fround(0.3), kind: 'float' });
  });

  it('adds doubles at full precision', () => {
    const result = add(double(0.1), double(0.2));
    expect(result.kind).toBe('double');
    expect(result.value).toBe(0.30000000000000004);
  });

  it('promotes the result kind', () => {
    expect(add(int(2), double(3.5)).kind).toBe('double');
    expect(add(int(2), long(3)).kind).toBe('long');
  });
});

describe('subtract', () => {
  it('subtracts ints', () => {
    expect(subtract(int(5), int(3))).toEqual({ value: 2, kind: 'int' });
  });

  it('subtracts longs', () => {
    expect(subtract(long(5), long(3))).toEqual({ value: 2, kind: 'long' });
  });

  it('subtracts floats', () => {
    expect(subtract(float(5.5), float(0.5))).toEqual({ value: 5, kind: 'float' });
  });

  it('subtracts doubles', () => {
    expect(subtract(double(5.5), double(0.5))).toEqual({ value: 5, kind: 'double' });
  });
});

describe('multiply', () => {
  it('multiplies ints and wraps at 32 bits', () => {
    expect(multiply(int(-2), int(-3))).toEqual({ value: 6, kind: 'int' });
    expect(multiply(int(65536), int(65536))).toEqual({ value: 0, kind: 'int' });
  });

  it('multiplies longs', () => {
    expect(multiply(long(3), long(4))).toEqual({ value: 12, kind: 'long' });
  });

  it('multiplies floats', () => {
    expect(multiply(float(1.5), float(2))).toEqual({ value: 3, kind: 'float' });
  });

  it('multiplies doubles', () => {
    expect(multiply(double(1.5), double(2))).toEqual({ value: 3, kind: 'double' });
  });
});

describe('divide', () => {
  it('truncates integer division toward zero', () => {
    expect(divide(int(8), int(5), 0)).toEqual({ value: 1, kind: 'int' });
    expect(divide(int(-7), int(2), 0)).toEqual({ value: -3, kind: 'int' });
    expect(divide(int(7), int(-2), 0)).toEqual({ value: -3, kind: 'int' });
  });

  it('truncates long division toward zero', () => {
    expect(divide(long(7), long(2), 0)).toEqual({ value: 3, kind: 'long' });
  });

  it('returns a float for floating operands', () => {
    expect(divide(float(7), float(2), 0)).toEqual({ value: 3.5, kind: 'float' });
  });

  it('returns a double for floating operands', () => {
    expect(divide(double(7), double(2), 0)).toEqual({ value: 3.5, kind: 'double' });
  });

  it('throws for an integral zero divisor', () => {
    expect(() => divide(int(1), int(0), 0)).toThrow(SpelEvaluationException);
    expect(() => divide(long(1), long(0), 0)).toThrow(SpelEvaluationException);
  });

  it('yields Infinity for a floating zero divisor', () => {
    expect(divide(double(1), double(0), 0).value).toBe(Number.POSITIVE_INFINITY);
    expect(divide(double(-1), double(0), 0).value).toBe(Number.NEGATIVE_INFINITY);
  });

  it('yields NaN for zero divided by zero', () => {
    expect(Number.isNaN(divide(double(0), double(0), 0).value)).toBe(true);
  });
});

describe('remainder', () => {
  it('takes the sign of the dividend', () => {
    expect(remainder(int(7), int(4), 0)).toEqual({ value: 3, kind: 'int' });
    expect(remainder(int(-7), int(3), 0)).toEqual({ value: -1, kind: 'int' });
    expect(remainder(int(7), int(-3), 0)).toEqual({ value: 1, kind: 'int' });
  });

  it('remainders longs', () => {
    expect(remainder(long(10), long(3), 0)).toEqual({ value: 1, kind: 'long' });
  });

  it('remainders floats and doubles', () => {
    expect(remainder(float(7), float(4), 0)).toEqual({ value: 3, kind: 'float' });
    expect(remainder(double(7.5), double(2), 0)).toEqual({ value: 1.5, kind: 'double' });
  });

  it('throws for an integral zero divisor', () => {
    expect(() => remainder(int(1), int(0), 0)).toThrow(SpelEvaluationException);
    expect(() => remainder(long(1), long(0), 0)).toThrow(SpelEvaluationException);
  });

  it('yields NaN for a floating zero divisor', () => {
    expect(Number.isNaN(remainder(double(1), double(0), 0).value)).toBe(true);
  });
});

describe('power', () => {
  it('always yields a double', () => {
    expect(power(int(2), int(3))).toEqual({ value: 8, kind: 'double' });
    expect(power(double(2), double(0.5)).value).toBeCloseTo(Math.SQRT2, 12);
  });
});

describe('negate', () => {
  it('preserves the operand kind', () => {
    expect(negate(int(5))).toEqual({ value: -5, kind: 'int' });
    expect(negate(long(5))).toEqual({ value: -5, kind: 'long' });
    expect(negate(float(5))).toEqual({ value: -5, kind: 'float' });
    expect(negate(double(5))).toEqual({ value: -5, kind: 'double' });
  });
});

describe('numericOperand', () => {
  it('uses the explicit kind when present', () => {
    expect(numericOperand(3, 'float', 0)).toEqual({ value: 3, kind: 'float' });
  });

  it('infers the kind when absent', () => {
    expect(numericOperand(3, undefined, 0)).toEqual({ value: 3, kind: 'int' });
    expect(numericOperand(3.5, undefined, 0)).toEqual({ value: 3.5, kind: 'double' });
  });

  it('throws when the value is not a number', () => {
    expect(() => numericOperand('a', undefined, 0)).toThrow(SpelEvaluationException);
    expect(() => numericOperand(null, undefined, 0)).toThrow(SpelEvaluationException);
  });
});

describe('bigint kind', () => {
  const big = (value: bigint): Numeric => ({ value, kind: 'bigint' });

  it('promotes between long and float', () => {
    expect(promote('bigint', 'long')).toBe('bigint');
    expect(promote('long', 'bigint')).toBe('bigint');
    expect(promote('bigint', 'int')).toBe('bigint');
    // BigInteger combined with a double becomes a double, as in Java.
    expect(promote('bigint', 'double')).toBe('double');
    expect(promote('bigint', 'float')).toBe('float');
  });

  it('counts as an integral kind', () => {
    expect(isIntegral('bigint')).toBe(true);
  });

  it('is inferred for a BigInt', () => {
    expect(inferKind(10n)).toBe('bigint');
    expect(numericOf(10n)).toEqual({ value: 10n, kind: 'bigint' });
  });

  it('arithmetic is exact', () => {
    const huge = 9007199254740993n;
    expect(add(big(huge), big(1n))).toEqual({ value: 9007199254740994n, kind: 'bigint' });
    expect(subtract(big(huge), big(1n))).toEqual({ value: 9007199254740992n, kind: 'bigint' });
    expect(multiply(big(huge), big(2n))).toEqual({ value: 18014398509481986n, kind: 'bigint' });
    expect(divide(big(7n), big(2n), 0)).toEqual({ value: 3n, kind: 'bigint' });
    expect(remainder(big(7n), big(2n), 0)).toEqual({ value: 1n, kind: 'bigint' });
    expect(negate(big(7n))).toEqual({ value: -7n, kind: 'bigint' });
  });

  it('promotes an int or long operand to bigint rather than losing precision', () => {
    expect(add(big(10n), { value: 1, kind: 'int' })).toEqual({ value: 11n, kind: 'bigint' });
    expect(add(big(10n), { value: 1, kind: 'long' })).toEqual({ value: 11n, kind: 'bigint' });
  });

  it('widens to double when a floating operand is present', () => {
    const result = add(big(10n), { value: 0.5, kind: 'double' });
    expect(result.kind).toBe('double');
    expect(result.value).toBe(10.5);
  });

  it('rejects an integral zero divisor', () => {
    expect(() => divide(big(1n), big(0n), 0)).toThrow(SpelEvaluationException);
    expect(() => remainder(big(1n), big(0n), 0)).toThrow(SpelEvaluationException);
  });

  it('is accepted as an operand', () => {
    expect(numericOperand(10n, undefined, 0)).toEqual({ value: 10n, kind: 'bigint' });
    expect(() => numericOperand('x', undefined, 0)).toThrow(SpelEvaluationException);
  });

  it('power widens to double', () => {
    expect(power(big(2n), big(10n))).toEqual({ value: 1024, kind: 'double' });
  });
});

describe('compareNumericValues', () => {
  it('compares two numbers', () => {
    expect(compareNumericValues(1, 2)).toBe(-1);
    expect(compareNumericValues(2, 2)).toBe(0);
    expect(compareNumericValues(3, 2)).toBe(1);
  });

  it('compares a BigInt with a number exactly', () => {
    expect(compareNumericValues(10n, 10)).toBe(0);
    expect(compareNumericValues(10n, 11)).toBe(-1);
    expect(compareNumericValues(11, 10n)).toBe(1);
  });

  it('does not round a value beyond float64 precision', () => {
    // 9007199254740993 is not representable, so a number for it rounds to ...992.
    // Written as a string because the literal would be rounded by the compiler
    // before the test could assert on it.
    const rounded = Number('9007199254740993');
    expect(rounded).toBe(9007199254740992);
    // The BigInt is not rounded with it, so the two are distinguished rather than
    // collapsing to the same value as they would if both were numbers.
    expect(compareNumericValues(9007199254740993n, rounded)).toBe(1);
    expect(compareNumericValues(9007199254740993n, 9007199254740993n)).toBe(0);
  });

  it('compares two BigInts', () => {
    expect(compareNumericValues(2n, 3n)).toBe(-1);
    expect(compareNumericValues(3n, 3n)).toBe(0);
  });

  it('falls back to a double comparison when a side is fractional', () => {
    expect(compareNumericValues(10n, 10.5)).toBe(-1);
    expect(compareNumericValues(10n, 9.5)).toBe(1);
  });

  it('returns undefined for a non-numeric or NaN operand', () => {
    expect(compareNumericValues('1', 1)).toBeUndefined();
    expect(compareNumericValues(1, null)).toBeUndefined();
    expect(compareNumericValues(Number.NaN, 1)).toBeUndefined();
    expect(compareNumericValues(1, Number.NaN)).toBeUndefined();
  });
});
