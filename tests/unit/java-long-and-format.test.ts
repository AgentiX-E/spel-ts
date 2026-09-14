/**
 * Contract tests for radix-aware Long methods and the documented String.format subset.
 *
 * Both carry a branch that a whole-expression suite never reaches. `parseLong` and `toString`
 * default the radix to ten and convert only when the caller supplies one, so the conversion
 * path is unattested unless a test passes it. `String.format` is a regex-driven switch over the
 * conversion letter, and the cases that no test writes are the ones that would silently render
 * nothing if they regressed.
 *
 * The expectations are Java's, not JavaScript's: `%f` is six decimals, `%c` takes a code point
 * and `%x` is lower case while `%X` is upper — which is the whole reason the subset exists.
 */
import { describe, expect, it } from 'vitest';
import { SpelEvaluationException } from '../../src/error/spel-evaluation-exception.js';
import { StandardTypeLocator } from '../../src/type/standard-type-locator.js';

const locator = new StandardTypeLocator();

/** Invoke a static method on a java.lang type. */
function call(type: string, name: string, ...args: unknown[]): unknown {
  return locator.findType(type).callStaticMethod(name, ...args);
}

describe('java.lang.Long - radix-aware parsing', () => {
  it('parseLong defaults to base ten', () => {
    expect(call('Long', 'parseLong', '10')).toBe(10);
  });

  it('parseLong converts when a radix is supplied', () => {
    expect(call('Long', 'parseLong', 'ff', 16)).toBe(255);
    expect(call('Long', 'parseLong', '101', 2)).toBe(5);
  });

  it('toString renders in the requested base', () => {
    expect(call('Long', 'toString', 255, 16)).toBe('ff');
    expect(call('Long', 'toString', 5, 2)).toBe('101');
    expect(call('Long', 'toString', 255)).toBe('255');
  });

  it('valueOf truncates towards zero', () => {
    expect(call('Long', 'valueOf', 3.9)).toBe(3);
    expect(call('Long', 'valueOf', -3.9)).toBe(-3);
  });

  it('rejects a string that is not a number instead of returning NaN', () => {
    expect(() => call('Long', 'valueOf', 'abc')).toThrow(SpelEvaluationException);
  });
});

describe('java.lang.String.format - the documented conversion set', () => {
  it('renders every conversion the implementation documents', () => {
    expect(
      call(
        'String',
        'format',
        '%s|%d|%f|%.2f|%x|%X|%o|%b|%c|%%',
        'a',
        5,
        1.5,
        1.005,
        255,
        255,
        8,
        true,
        65,
      ),
    ).toBe('a|5|1.500000|1.00|ff|FF|10|true|A|%');
  });

  it('%c reads an integral argument as a code point, not as digits', () => {
    // Java: `String.format("%c", 65)` is "A". Rendering the argument verbatim produced "65",
    // which is what `%s` already does — the two conversions have to differ for `%c` to mean
    // anything at all.
    expect(call('String', 'format', '%c', 65)).toBe('A');
    expect(call('String', 'format', '%c', 0x4e2d)).toBe('\u4e2d');
  });

  it('%c passes a character argument through', () => {
    expect(call('String', 'format', '%c', 'A')).toBe('A');
    expect(call('String', 'format', '%c', '\u4e2d')).toBe('\u4e2d');
  });

  it('honours a width and the left-align flag', () => {
    expect(call('String', 'format', '%5d', 42)).toBe('   42');
    expect(call('String', 'format', '%-5d|', 42)).toBe('42   |');
  });

  it('coerces a numeric string for %d rather than rendering it verbatim', () => {
    expect(call('String', 'format', '%d', '12')).toBe('12');
  });
});
