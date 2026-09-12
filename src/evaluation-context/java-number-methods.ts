/**
 * Numeric wrapper method invocation.
 *
 * SpEL resolves a method call on a number against the Java wrapper classes —
 * `Integer`, `Long`, `Double`, `Float`, `Byte`, `Short` — and a
 * `java.math.BigInteger` when the value came from one. JavaScript's `Number`
 * offers a different set under different names, so a number is resolved against
 * this table only, for the same reason a string is resolved against
 * `java.lang.String` only. A shared receiver would let a JavaScript method answer
 * for a Java name.
 *
 * That is why `toFixed` and `toExponential` no longer resolve. Neither is a
 * member of any Java type, so Spring raises method-not-found; they were callable
 * only because JavaScript's `Number` happened to provide them. The Java ways to
 * format a number are `T(String).format('%.2f', n)`, which the type catalogue
 * makes available, or `T(Math).round(n * 100) / 100` for a rounded value.
 *
 * The reverse gap is closed here as well: `intValue`, `doubleValue` and their
 * siblings exist in Java and previously had no implementation.
 */
import { TypedValue } from '../typed-value.js';
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';

/** Position used when the caller does not know it; the AST node fills it in. */
const UNKNOWN_POSITION = -1;

function requireNumber(value: unknown, method: string, position: number): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  throw new SpelEvaluationException(position, SpelMessage.TYPE_CONVERSION_ERROR, method, 'number');
}

/** Truncate toward zero, keeping the value exact when it is already a BigInt. */
function toTruncatedBigInt(value: number | bigint): bigint {
  return typeof value === 'bigint' ? value : BigInt(Math.trunc(value));
}

/** Java's narrowing conversions keep the low bits, so a byte is `value & 0xFF`. */
function narrow(value: number | bigint, bits: number): number {
  return Number(BigInt.asIntN(bits, toTruncatedBigInt(value)));
}

/**
 * Invoke a Java wrapper method, or return null when the name is not one.
 */
export function invokeNumberMethod(
  target: number | bigint,
  name: string,
  args: readonly unknown[],
  position: number = UNKNOWN_POSITION,
): TypedValue | null {
  switch (name) {
    case 'toString':
      return new TypedValue(String(target));
    case 'byteValue':
      return new TypedValue(narrow(target, 8), null, 'int');
    case 'shortValue':
      return new TypedValue(narrow(target, 16), null, 'int');
    case 'intValue':
      return new TypedValue(narrow(target, 32), null, 'int');
    case 'longValue':
      // A JavaScript number's integral part fits in 64 bits, so truncation is
      // exact; a BigInt takes its low 64 bits, as Java does.
      return new TypedValue(
        typeof target === 'bigint' ? narrow(target, 64) : Math.trunc(target),
        null,
        'long',
      );
    case 'floatValue':
      return new TypedValue(Math.fround(requireNumber(target, name, position)), null, 'float');
    case 'doubleValue':
      return new TypedValue(requireNumber(target, name, position), null, 'double');
    case 'equals': {
      const other = args[0];
      if (typeof other !== 'number' && typeof other !== 'bigint') {
        return new TypedValue(false);
      }
      if (typeof target === 'bigint' || typeof other === 'bigint') {
        const left = toTruncatedBigInt(target);
        const right = toTruncatedBigInt(other);
        return new TypedValue(left === right);
      }
      return new TypedValue(target === other);
    }
    case 'compareTo': {
      const other = requireNumber(args[0], name, position);
      const self = requireNumber(target, name, position);
      return new TypedValue(self < other ? -1 : self > other ? 1 : 0);
    }
    default:
      return null;
  }
}
