/**
 * Spring's `Operator#equalityCheck`.
 *
 * The important property is the absence of coercion between unrelated types: a
 * String is never equal to a Number, and a Boolean is never equal to a Number,
 * because Java compares either numerically or with `equals`, and never both.
 * The previous implementation fell back to comparing `String(left)` with
 * `String(right)`, which made `'1' == 1` and `true == 1` both true.
 */
import { compareNumericValues } from '../../type/numeric.js';

export function equalityCheck(left: unknown, right: unknown): boolean {
  // Null is equal only to null.
  if (left === null || left === undefined) {
    return right === null || right === undefined;
  }
  if (right === null || right === undefined) {
    return false;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    // `NaN !== NaN` here, as in Java.
    return left === right;
  }

  // A BigInt is compared numerically and exactly against another integral value,
  // so `10n == 10` holds and a value beyond float64 precision does not round to
  // its neighbour. Before this it fell through to the typeof check below and was
  // reported as unequal.
  const numeric = compareNumericValues(left, right);
  if (numeric !== undefined) {
    return numeric === 0;
  }

  if (typeof left === 'string' && typeof right === 'string') {
    return left === right;
  }
  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return left === right;
  }

  // Different families never compare equal, so no coercion is attempted.
  if (typeof left !== typeof right) {
    return false;
  }

  return Object.is(left, right);
}
