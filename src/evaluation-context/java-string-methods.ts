/**
 * `java.lang.String` method invocation.
 *
 * SpEL resolves a method call on a string against `java.lang.String`, so the
 * behaviour that matters is Java's, not JavaScript's. Several method names are
 * shared by the two languages with **different semantics**, and a JavaScript
 * implementation winning the lookup produces a plausible wrong answer rather
 * than an error:
 *
 *  - `replaceAll(regex, replacement)` takes a regular expression in Java. The
 *    JavaScript `String.prototype.replaceAll` takes a *string*, so
 *    `'a1b2'.replaceAll('\\d', '-')` returned the input unchanged.
 *  - `replace(target, replacement)` replaces **every** occurrence in Java. The
 *    JavaScript version replaces only the first.
 *  - `split(regex)` takes a regular expression in Java and discards trailing
 *    empty strings; the JavaScript version treats the argument as a literal.
 *  - `charAt` and `substring` throw for an out-of-range index in Java, where the
 *    JavaScript fallback silently clamped or returned an empty string.
 *
 * Because of that, a string target is resolved against this table only. Names
 * that JavaScript has and Java does not, such as `includes`, are therefore not
 * callable, which matches Spring, where they would be a method-not-found error.
 */
import { TypedValue } from '../typed-value.js';
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';

/** Position used when the caller does not know it; the AST node fills it in. */
const UNKNOWN_POSITION = -1;

/**
 * Invoke a `java.lang.String` method, or return null when the name is not one.
 */
export function invokeStringMethod(
  source: string,
  name: string,
  args: readonly unknown[],
  position: number = UNKNOWN_POSITION,
): TypedValue | null {
  switch (name) {
    case 'length':
      return new TypedValue(source.length);
    case 'isEmpty':
      return new TypedValue(source.length === 0);
    case 'isBlank':
      return new TypedValue(source.trim().length === 0);
    case 'toString':
      return new TypedValue(source);
    case 'charAt':
      return new TypedValue(charAt(source, args, position));
    case 'substring':
      return new TypedValue(substring(source, args, position));
    case 'contains':
      return new TypedValue(source.includes(requireString(args[0], name, position)));
    case 'startsWith':
      return new TypedValue(source.startsWith(requireString(args[0], name, position)));
    case 'endsWith':
      return new TypedValue(source.endsWith(requireString(args[0], name, position)));
    case 'indexOf':
      return new TypedValue(indexOf(source, args, position));
    case 'lastIndexOf':
      return new TypedValue(lastIndexOf(source, args, position));
    case 'toLowerCase':
      return new TypedValue(source.toLowerCase());
    case 'toUpperCase':
      return new TypedValue(source.toUpperCase());
    case 'trim':
    case 'strip':
      return new TypedValue(source.trim());
    case 'concat':
      return new TypedValue(source + requireString(args[0], name, position));
    case 'equals':
      return new TypedValue(source === requireString(args[0], name, position));
    case 'equalsIgnoreCase':
      return new TypedValue(
        source.toLowerCase() === requireString(args[0], name, position).toLowerCase(),
      );
    case 'compareTo':
      return new TypedValue(compareTo(source, requireString(args[0], name, position)));
    case 'compareToIgnoreCase':
      return new TypedValue(
        compareTo(source.toLowerCase(), requireString(args[0], name, position).toLowerCase()),
      );
    case 'matches':
      return new TypedValue(matchesWhole(source, requireString(args[0], name, position), position));
    case 'replace':
      return new TypedValue(
        replaceLiteral(
          source,
          requireString(args[0], name, position),
          requireString(args[1], name, position),
        ),
      );
    case 'replaceAll':
      return new TypedValue(
        replacePattern(
          source,
          requireString(args[0], name, position),
          requireString(args[1], name, position),
          position,
          true,
        ),
      );
    case 'replaceFirst':
      return new TypedValue(
        replacePattern(
          source,
          requireString(args[0], name, position),
          requireString(args[1], name, position),
          position,
          false,
        ),
      );
    case 'split':
      return new TypedValue(splitPattern(source, args, position));
    default:
      return null;
  }
}

function requireString(value: unknown, method: string, position: number): string {
  if (typeof value === 'string') {
    return value;
  }
  throw new SpelEvaluationException(position, SpelMessage.TYPE_CONVERSION_ERROR, method, 'String');
}

function requireInt(value: unknown, method: string, position: number): number {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  throw new SpelEvaluationException(position, SpelMessage.TYPE_CONVERSION_ERROR, method, 'int');
}

/** Java throws for an index outside the string; it does not clamp. */
function charAt(source: string, args: readonly unknown[], position: number): string {
  const index = requireInt(args[0], 'charAt', position);
  if (index < 0 || index >= source.length) {
    throw new SpelEvaluationException(position, SpelMessage.INDEX_OUT_OF_BOUNDS);
  }
  return source.charAt(index);
}

/** Java rejects a begin index below zero, an end index past the end, or begin > end. */
function substring(source: string, args: readonly unknown[], position: number): string {
  const begin = requireInt(args[0], 'substring', position);
  const end = args.length > 1 ? requireInt(args[1], 'substring', position) : source.length;
  if (begin < 0 || end > source.length || begin > end) {
    throw new SpelEvaluationException(position, SpelMessage.INDEX_OUT_OF_BOUNDS);
  }
  return source.substring(begin, end);
}

function indexOf(source: string, args: readonly unknown[], position: number): number {
  const search = requireString(args[0], 'indexOf', position);
  if (args.length === 1) {
    return source.indexOf(search);
  }
  const from = Math.max(0, Math.min(requireInt(args[1], 'indexOf', position), source.length));
  return source.indexOf(search, from);
}

function lastIndexOf(source: string, args: readonly unknown[], position: number): number {
  const search = requireString(args[0], 'lastIndexOf', position);
  if (args.length === 1) {
    return source.lastIndexOf(search);
  }
  return source.lastIndexOf(search, requireInt(args[1], 'lastIndexOf', position));
}

/**
 * Java's `String.compareTo`: the difference of the first differing character
 * codes, or the difference in length when one string is a prefix of the other.
 */
function compareTo(left: string, right: string): number {
  const shared = Math.min(left.length, right.length);
  for (let index = 0; index < shared; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) {
      return difference;
    }
  }
  return left.length - right.length;
}

function compilePattern(pattern: string, flags: string, position: number): RegExp {
  try {
    return new RegExp(pattern, flags);
  } catch {
    throw new SpelEvaluationException(position, SpelMessage.FLAWED_PATTERN, pattern);
  }
}

/** `String.matches` requires the whole input to match, so the pattern is anchored. */
function matchesWhole(source: string, pattern: string, position: number): boolean {
  return compilePattern(`^(?:${pattern})$`, '', position).test(source);
}

/** `String.replace` replaces every occurrence, and treats the target literally. */
function replaceLiteral(source: string, target: string, replacement: string): string {
  if (target === '') {
    // Java inserts the replacement at both ends and between every character.
    // Iterating by code unit matches Java's `char`-based view of a String and
    // avoids the spread operator, which would decompose by code point.
    let widened = replacement;
    for (let index = 0; index < source.length; index += 1) {
      widened += source.charAt(index) + replacement;
    }
    return widened;
  }
  return source.split(target).join(replacement);
}

function replacePattern(
  source: string,
  pattern: string,
  replacement: string,
  position: number,
  all: boolean,
): string {
  return source.replace(compilePattern(pattern, all ? 'g' : '', position), replacement);
}

/**
 * `String.split`. The argument is a regular expression, trailing empty strings
 * are discarded unless a negative limit is given, and a positive limit bounds
 * the number of applications of the pattern.
 */
function splitPattern(source: string, args: readonly unknown[], position: number): string[] {
  const pattern = requireString(args[0], 'split', position);
  const limit = args.length > 1 ? requireInt(args[1], 'split', position) : undefined;

  // Java returns the input unchanged, as a single element, when it is empty.
  if (source === '') {
    return [''];
  }

  const regex = compilePattern(pattern, 'g', position);

  if (limit !== undefined && limit > 0) {
    return splitWithLimit(source, regex, limit);
  }

  const parts = source.split(regex);
  // A negative limit keeps every element. A zero limit behaves like no limit,
  // and both discard trailing empty strings.
  if (limit !== undefined && limit < 0) {
    return parts;
  }
  let end = parts.length;
  while (end > 1 && parts[end - 1] === '') {
    end -= 1;
  }
  return parts.slice(0, end);
}

function splitWithLimit(source: string, regex: RegExp, limit: number): string[] {
  const parts: string[] = [];
  let start = 0;
  let match = regex.exec(source);

  while (match !== null && parts.length < limit - 1) {
    if (start === 0 && match.index === 0 && match[0].length === 0) {
      // Java does not include a leading empty element for a zero-width match at
      // the very start of the input, so `split('')` does not begin with ''.
      regex.lastIndex += 1;
      match = regex.exec(source);
      continue;
    }
    parts.push(source.slice(start, match.index));
    start = match.index + match[0].length;
    if (match[0].length === 0) {
      // A zero-width match does not advance lastIndex, so step over it.
      regex.lastIndex += 1;
    }
    match = regex.exec(source);
  }

  // The final element holds everything not yet consumed.
  parts.push(source.slice(start));
  return parts;
}
