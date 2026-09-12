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
  integerLiteralKind,
  isIntegral,
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

describe('integerLiteralKind', () => {
  it('types a literal inside the int range as int', () => {
    expect(integerLiteralKind(0)).toBe('int');
    expect(integerLiteralKind(2147483647)).toBe('int');
    expect(integerLiteralKind(-2147483648)).toBe('int');
  });

  it('types a literal beyond int as long, as Java does', () => {
    expect(integerLiteralKind(2147483648)).toBe('long');
    expect(integerLiteralKind(-2147483649)).toBe('long');
    expect(integerLiteralKind(-2147483904)).toBe('long');
  });

  it('falls back to double beyond long precision', () => {
    expect(integerLiteralKind(2 ** 53 + 2)).toBe('double');
  });

  it('ignores any fractional part', () => {
    expect(integerLiteralKind(5.9)).toBe('int');
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
