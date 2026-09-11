/**
 * Java numeric model.
 *
 * JavaScript has a single number type, so an expression evaluator that ports
 * Java semantics has to carry the numeric kind alongside the value. Without it,
 * `8 / 5` evaluates to `1.6` where Java yields `1`, integer overflow silently
 * produces a value outside the `int` range, and `long` arithmetic loses
 * precision above 2^53.
 *
 * The rules implemented here follow the Java Language Specification:
 *
 *  - Binary numeric promotion (JLS 5.6.2): if either operand is `double` the
 *    result is `double`; otherwise if either is `float` the result is `float`;
 *    otherwise if either is `long` the result is `long`; otherwise `int`.
 *  - Integer division and remainder truncate toward zero (JLS 15.17.2, 15.17.3),
 *    and the sign of a remainder follows the dividend.
 *  - `int` arithmetic wraps at 32 bits and `long` at 64 bits (JLS 15.18.2).
 *  - Division and remainder by zero throw for the integral kinds, but yield
 *    `Infinity` or `NaN` for `float` and `double`, following IEEE-754.
 */
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';

export type NumericKind = 'int' | 'long' | 'float' | 'double';

/** A value paired with the Java numeric kind it is currently typed as. */
export interface Numeric {
  readonly value: number;
  readonly kind: NumericKind;
}

const PROMOTION_RANK: Readonly<Record<NumericKind, number>> = {
  int: 0,
  long: 1,
  float: 2,
  double: 3,
};

/** Binary numeric promotion: the wider of two kinds wins. */
export function promote(left: NumericKind, right: NumericKind): NumericKind {
  return PROMOTION_RANK[left] >= PROMOTION_RANK[right] ? left : right;
}

export function isIntegral(kind: NumericKind): boolean {
  return kind === 'int' || kind === 'long';
}

/**
 * Infer a kind for a runtime number that carries no explicit kind, which is
 * what happens when a value arrives from a property or a variable rather than
 * from a literal.
 *
 * JSON has no declared types, so an integral value is treated as `int` and
 * anything else as `double`. That matches how Spring would see an `Integer`
 * versus a `Double` property, and it is the closest available approximation.
 */
export function inferKind(value: number): NumericKind {
  return Number.isInteger(value) ? 'int' : 'double';
}

export function numericOf(value: number, kind?: NumericKind): Numeric {
  return { value, kind: kind ?? inferKind(value) };
}

/** Truncate toward zero and wrap into the signed 32-bit `int` range. */
function wrapInt32(value: number): number {
  return Math.trunc(value) | 0;
}

/** Truncate toward zero and wrap into the signed 64-bit `long` range. */
function wrapInt64(value: number): number {
  return Number(BigInt.asIntN(64, BigInt(Math.trunc(value))));
}

/** Round to the nearest 32-bit `float`. */
function roundFloat(value: number): number {
  return Math.fround(value);
}

/**
 * Force a raw JavaScript result into the range and precision of its Java kind.
 */
function coerce(raw: number, kind: NumericKind): number {
  switch (kind) {
    case 'int':
      return wrapInt32(raw);
    case 'long':
      return wrapInt64(raw);
    case 'float':
      return roundFloat(raw);
    case 'double':
      return raw;
  }
}

export function add(left: Numeric, right: Numeric): Numeric {
  const kind = promote(left.kind, right.kind);
  return { value: coerce(left.value + right.value, kind), kind };
}

export function subtract(left: Numeric, right: Numeric): Numeric {
  const kind = promote(left.kind, right.kind);
  return { value: coerce(left.value - right.value, kind), kind };
}

export function multiply(left: Numeric, right: Numeric): Numeric {
  const kind = promote(left.kind, right.kind);
  return { value: coerce(left.value * right.value, kind), kind };
}

/**
 * Division. Integral kinds truncate toward zero and reject a zero divisor;
 * floating kinds follow IEEE-754 and return `Infinity`, `-Infinity` or `NaN`.
 */
export function divide(left: Numeric, right: Numeric, position: number): Numeric {
  const kind = promote(left.kind, right.kind);

  if (isIntegral(kind)) {
    if (right.value === 0) {
      throw new SpelEvaluationException(position, SpelMessage.DIVISION_BY_ZERO);
    }
    const quotient = Math.trunc(left.value / right.value);
    return { value: kind === 'int' ? wrapInt32(quotient) : wrapInt64(quotient), kind };
  }

  return { value: coerce(left.value / right.value, kind), kind };
}

/**
 * Remainder. The sign follows the dividend, which JavaScript already does for
 * integral operands, so only the wrapping and the zero guard are added.
 */
export function remainder(left: Numeric, right: Numeric, position: number): Numeric {
  const kind = promote(left.kind, right.kind);

  if (isIntegral(kind)) {
    if (right.value === 0) {
      throw new SpelEvaluationException(position, SpelMessage.DIVISION_BY_ZERO);
    }
    const rest = left.value % right.value;
    return { value: kind === 'int' ? wrapInt32(rest) : wrapInt64(rest), kind };
  }

  return { value: coerce(left.value % right.value, kind), kind };
}

/**
 * Exponentiation. `Math.pow` is a double-precision operation, so the result is
 * always `double`, matching Java's `Math.pow(double, double)`.
 */
export function power(left: Numeric, right: Numeric): Numeric {
  return { value: Math.pow(left.value, right.value), kind: 'double' };
}

/**
 * Coerce an evaluated operand to a numeric value.
 *
 * Spring raises a type-conversion error when an operand of an arithmetic
 * operator is not a number, rather than coercing it.
 */
export function numericOperand(
  value: unknown,
  kind: NumericKind | undefined,
  position: number,
): Numeric {
  if (typeof value !== 'number') {
    throw new SpelEvaluationException(position, SpelMessage.TYPE_CONVERSION_ERROR);
  }
  return { value, kind: kind ?? inferKind(value) };
}

/** Unary negation, preserving the operand's kind. */
export function negate(operand: Numeric): Numeric {
  return { value: coerce(-operand.value, operand.kind), kind: operand.kind };
}
