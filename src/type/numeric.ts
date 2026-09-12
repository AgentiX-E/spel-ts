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
 *
 * `bigint` is an addition rather than a Java primitive. It carries a JavaScript
 * BigInt and stands in for `java.math.BigInteger`, which Java programmers reach
 * for when 64 bits are not enough. It ranks between `long` and `float`, so a
 * BigInt combined with an `int` or a `long` stays exact, while a BigInt combined
 * with a `double` becomes a double — the same widening Java applies to
 * `BigInteger`.
 */
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';

export type NumericKind = 'int' | 'long' | 'bigint' | 'float' | 'double';

/** A value paired with the Java numeric kind it is currently typed as. */
export interface Numeric {
  readonly value: number | bigint;
  readonly kind: NumericKind;
}

const PROMOTION_RANK: Readonly<Record<NumericKind, number>> = {
  int: 0,
  long: 1,
  bigint: 2,
  float: 3,
  double: 4,
};

/** Binary numeric promotion: the wider of two kinds wins. */
export function promote(left: NumericKind, right: NumericKind): NumericKind {
  return PROMOTION_RANK[left] >= PROMOTION_RANK[right] ? left : right;
}

export function isIntegral(kind: NumericKind): boolean {
  return kind === 'int' || kind === 'long' || kind === 'bigint';
}

/**
 * Infer a kind for a runtime value that carries no explicit kind, which is what
 * happens when a value arrives from a property or a variable rather than from a
 * literal.
 *
 * JSON declares no types, so an integral value is treated as `int` and anything
 * else as `double`. That matches how Spring would see an `Integer` versus a
 * `Double` property. A BigInt is exact by construction, so it keeps its own kind.
 */
export function inferKind(value: number | bigint): NumericKind {
  if (typeof value === 'bigint') {
    return 'bigint';
  }
  return Number.isInteger(value) ? 'int' : 'double';
}

export function numericOf(value: number | bigint, kind?: NumericKind): Numeric {
  return { value, kind: kind ?? inferKind(value) };
}

/**
 * Choose the kind of an `L`-suffixed literal, which is a `long` in Java whatever
 * its magnitude — unlike an unsuffixed literal, which is always an `int` and is
 * rejected by the tokenizer when the value does not fit.
 *
 * Without this, `1L` is typed `int` by magnitude, and `2147483647L + 1L` wraps at
 * 32 bits to `-2147483648` instead of yielding `2147483648`. A value a JavaScript
 * number cannot hold exactly is carried as a bigint, and a bigint is the widest
 * integral kind, so it stays exact through arithmetic.
 */
export function longLiteralKind(value: number | bigint): NumericKind {
  return typeof value === 'bigint' ? 'bigint' : 'long';
}

/** Exact conversion, used only when the promoted kind is `bigint`. */
function toBigInt(value: number | bigint): bigint {
  return typeof value === 'bigint' ? value : BigInt(Math.trunc(value));
}

/** Widening conversion for a `bigint` operand meeting a floating kind. */
function asNumber(value: number | bigint): number {
  return typeof value === 'bigint' ? Number(value) : value;
}

/** Exact integer view of a value, or undefined when it has a fractional part. */
function asExactInteger(value: number | bigint): bigint | undefined {
  if (typeof value === 'bigint') {
    return value;
  }
  return Number.isInteger(value) ? BigInt(value) : undefined;
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
 *
 * `bigint` never reaches here: it is arbitrary precision, exactly as Java's
 * `BigInteger` is, so it needs no coercion.
 */
function coerce(raw: number, kind: NumericKind): number {
  switch (kind) {
    case 'int':
      return wrapInt32(raw);
    case 'long':
      return wrapInt64(raw);
    case 'float':
      return roundFloat(raw);
    default:
      return raw;
  }
}

export function add(left: Numeric, right: Numeric): Numeric {
  const kind = promote(left.kind, right.kind);
  if (kind === 'bigint') {
    return { value: toBigInt(left.value) + toBigInt(right.value), kind };
  }
  return { value: coerce(asNumber(left.value) + asNumber(right.value), kind), kind };
}

export function subtract(left: Numeric, right: Numeric): Numeric {
  const kind = promote(left.kind, right.kind);
  if (kind === 'bigint') {
    return { value: toBigInt(left.value) - toBigInt(right.value), kind };
  }
  return { value: coerce(asNumber(left.value) - asNumber(right.value), kind), kind };
}

export function multiply(left: Numeric, right: Numeric): Numeric {
  const kind = promote(left.kind, right.kind);
  if (kind === 'bigint') {
    return { value: toBigInt(left.value) * toBigInt(right.value), kind };
  }
  return { value: coerce(asNumber(left.value) * asNumber(right.value), kind), kind };
}

/**
 * Division. Integral kinds truncate toward zero and reject a zero divisor;
 * floating kinds follow IEEE-754 and return `Infinity`, `-Infinity` or `NaN`.
 */
export function divide(left: Numeric, right: Numeric, position: number): Numeric {
  const kind = promote(left.kind, right.kind);

  if (isIntegral(kind)) {
    const divisor = toBigInt(right.value);
    if (divisor === BigInt(0)) {
      throw new SpelEvaluationException(position, SpelMessage.DIVISION_BY_ZERO);
    }
    if (kind === 'bigint') {
      // BigInt division truncates toward zero, as Java's does.
      return { value: toBigInt(left.value) / divisor, kind };
    }
    const quotient = Math.trunc(asNumber(left.value) / asNumber(right.value));
    return { value: kind === 'int' ? wrapInt32(quotient) : wrapInt64(quotient), kind };
  }

  return { value: coerce(asNumber(left.value) / asNumber(right.value), kind), kind };
}

/**
 * Remainder. The sign follows the dividend, which JavaScript and BigInt both
 * already do for integral operands, so only the wrapping and the zero guard are
 * added.
 */
export function remainder(left: Numeric, right: Numeric, position: number): Numeric {
  const kind = promote(left.kind, right.kind);

  if (isIntegral(kind)) {
    const divisor = toBigInt(right.value);
    if (divisor === BigInt(0)) {
      throw new SpelEvaluationException(position, SpelMessage.DIVISION_BY_ZERO);
    }
    if (kind === 'bigint') {
      return { value: toBigInt(left.value) % divisor, kind };
    }
    const rest = asNumber(left.value) % asNumber(right.value);
    return { value: kind === 'int' ? wrapInt32(rest) : wrapInt64(rest), kind };
  }

  return { value: coerce(asNumber(left.value) % asNumber(right.value), kind), kind };
}

/**
 * Exponentiation. `Math.pow` is a double-precision operation, so the result is
 * always `double`, matching Java's `Math.pow(double, double)`.
 */
export function power(left: Numeric, right: Numeric): Numeric {
  return { value: Math.pow(asNumber(left.value), asNumber(right.value)), kind: 'double' };
}

/** Unary negation, preserving the operand's kind. */
export function negate(operand: Numeric): Numeric {
  if (operand.kind === 'bigint') {
    return { value: -toBigInt(operand.value), kind: 'bigint' };
  }
  return { value: coerce(-asNumber(operand.value), operand.kind), kind: operand.kind };
}

/**
 * Coerce an evaluated operand to a numeric value.
 *
 * Spring raises a type-conversion error when an operand of an arithmetic
 * operator is not a number, rather than coercing it. A BigInt counts as numeric:
 * it is exact, and rejecting it would make the one integer type that cannot lose
 * precision unusable.
 */
export function numericOperand(
  value: unknown,
  kind: NumericKind | undefined,
  position: number,
): Numeric {
  if (typeof value === 'number') {
    return { value, kind: kind ?? inferKind(value) };
  }
  if (typeof value === 'bigint') {
    return { value, kind: 'bigint' };
  }
  throw new SpelEvaluationException(position, SpelMessage.TYPE_CONVERSION_ERROR);
}

/**
 * Compare two values numerically, returning -1, 0 or 1, or undefined when either
 * is not numeric.
 *
 * A BigInt is compared exactly against another integral value by promoting both
 * to BigInt, so `10n == 10` holds and a value beyond float64 precision does not
 * round to its neighbour. A fractional operand forces a double comparison, which
 * is the same widening Java performs.
 */
export function compareNumericValues(left: unknown, right: unknown): number | undefined {
  const leftIsNumeric = typeof left === 'number' || typeof left === 'bigint';
  const rightIsNumeric = typeof right === 'number' || typeof right === 'bigint';
  if (!leftIsNumeric || !rightIsNumeric) {
    return undefined;
  }

  if (typeof left === 'number' && Number.isNaN(left)) {
    return undefined;
  }
  if (typeof right === 'number' && Number.isNaN(right)) {
    return undefined;
  }

  const leftInteger = asExactInteger(left);
  const rightInteger = asExactInteger(right);

  if (leftInteger !== undefined && rightInteger !== undefined) {
    return leftInteger < rightInteger ? -1 : leftInteger > rightInteger ? 1 : 0;
  }

  const leftNumber = asNumber(left);
  const rightNumber = asNumber(right);
  return leftNumber < rightNumber ? -1 : leftNumber > rightNumber ? 1 : 0;
}
