/**
 * Contract tests for `java.lang.String` method invocation.
 *
 * Two things are being protected here. The first is the semantics: several of
 * these names also exist on JavaScript's String with different behaviour, and
 * the resolver previously let the JavaScript implementation win, so
 * `replaceAll` silently ignored its regular expression.
 *
 * The second is the error behaviour. Java reports an out-of-range index; the
 * JavaScript fallback clamped or returned an empty string, which masked the
 * mistake instead of surfacing it.
 */
import { describe, expect, it } from 'vitest';
import { SpelEvaluationException } from '../../src/error/spel-evaluation-exception.js';
import { invokeStringMethod } from '../../src/evaluation-context/java-string-methods.js';

/** Invoke a method and unwrap the value, failing the test on an unknown name. */
function call(source: string, name: string, ...args: unknown[]): unknown {
  const result = invokeStringMethod(source, name, args);
  expect(result, `${name} should be a java.lang.String method`).not.toBeNull();
  return result?.getValue();
}

describe('invokeStringMethod — lookups', () => {
  it('reports an unknown name so the caller can fail the lookup', () => {
    expect(invokeStringMethod('abc', 'includes', ['a'])).toBeNull();
    expect(invokeStringMethod('abc', 'padStart', [4])).toBeNull();
  });
});

describe('invokeStringMethod — queries', () => {
  it('length, isEmpty and isBlank', () => {
    expect(call('abc', 'length')).toBe(3);
    expect(call('', 'length')).toBe(0);
    expect(call('', 'isEmpty')).toBe(true);
    expect(call('abc', 'isEmpty')).toBe(false);
    expect(call('  ', 'isBlank')).toBe(true);
    expect(call(' x ', 'isBlank')).toBe(false);
  });

  it('contains, startsWith and endsWith', () => {
    expect(call('abc', 'contains', 'b')).toBe(true);
    expect(call('abc', 'contains', 'z')).toBe(false);
    expect(call('abc', 'startsWith', 'ab')).toBe(true);
    expect(call('abc', 'endsWith', 'c')).toBe(true);
    expect(call('abc', 'endsWith', 'a')).toBe(false);
  });

  it('indexOf with and without a starting position', () => {
    expect(call('abcabc', 'indexOf', 'c')).toBe(2);
    expect(call('abcabc', 'indexOf', 'c', 3)).toBe(5);
    expect(call('abc', 'indexOf', 'z')).toBe(-1);
    // A negative or oversized start position is clamped, not rejected.
    expect(call('abc', 'indexOf', 'b', -5)).toBe(1);
    expect(call('abc', 'indexOf', 'b', 99)).toBe(-1);
  });

  it('lastIndexOf with and without a starting position', () => {
    expect(call('abcabc', 'lastIndexOf', 'c')).toBe(5);
    expect(call('abcabc', 'lastIndexOf', 'c', 3)).toBe(2);
    expect(call('abc', 'lastIndexOf', 'z')).toBe(-1);
  });

  it('toString returns the string itself', () => {
    expect(call('abc', 'toString')).toBe('abc');
  });
});

describe('invokeStringMethod — comparison', () => {
  it('equals and equalsIgnoreCase', () => {
    expect(call('abc', 'equals', 'abc')).toBe(true);
    expect(call('abc', 'equals', 'ABC')).toBe(false);
    expect(call('abc', 'equalsIgnoreCase', 'ABC')).toBe(true);
    expect(call('abc', 'equalsIgnoreCase', 'abd')).toBe(false);
  });

  it('compareTo reports the first difference then the length difference', () => {
    expect(call('abc', 'compareTo', 'abc')).toBe(0);
    expect(call('abc', 'compareTo', 'abd')).toBe(-1);
    expect(call('abd', 'compareTo', 'abc')).toBe(1);
    expect(call('ab', 'compareTo', 'abc')).toBe(-1);
    expect(call('abc', 'compareTo', 'ab')).toBe(1);
  });

  it('compareToIgnoreCase ignores case', () => {
    expect(call('abc', 'compareToIgnoreCase', 'ABC')).toBe(0);
    expect(call('ABC', 'compareToIgnoreCase', 'abd')).toBe(-1);
  });
});

describe('invokeStringMethod — transformation', () => {
  it('toLowerCase, toUpperCase, trim and strip', () => {
    expect(call('AbC', 'toLowerCase')).toBe('abc');
    expect(call('AbC', 'toUpperCase')).toBe('ABC');
    expect(call('  x  ', 'trim')).toBe('x');
    expect(call('  x  ', 'strip')).toBe('x');
  });

  it('concat appends without coercing the argument to a number', () => {
    expect(call('abc', 'concat', 'de')).toBe('abcde');
  });

  it('charAt returns the character at a valid index', () => {
    expect(call('abc', 'charAt', 0)).toBe('a');
    expect(call('abc', 'charAt', 2)).toBe('c');
  });

  it('substring with one and two arguments', () => {
    expect(call('hello world', 'substring', 6)).toBe('world');
    expect(call('hello world', 'substring', 0, 5)).toBe('hello');
    expect(call('abc', 'substring', 1, 1)).toBe('');
  });
});

describe('invokeStringMethod — reporting an out-of-range index', () => {
  it('charAt rejects an index outside the string', () => {
    expect(() => call('abc', 'charAt', 3)).toThrow(SpelEvaluationException);
    expect(() => call('abc', 'charAt', -1)).toThrow(SpelEvaluationException);
  });

  it('substring rejects a range outside the string', () => {
    expect(() => call('abc', 'substring', -1)).toThrow(SpelEvaluationException);
    expect(() => call('abc', 'substring', 0, 4)).toThrow(SpelEvaluationException);
    expect(() => call('abc', 'substring', 2, 1)).toThrow(SpelEvaluationException);
  });

  it('rejects a non-string or non-integer argument', () => {
    expect(() => call('abc', 'contains', 1)).toThrow(SpelEvaluationException);
    expect(() => call('abc', 'charAt', 'x')).toThrow(SpelEvaluationException);
    expect(() => call('abc', 'charAt', 1.5)).toThrow(SpelEvaluationException);
  });
});

describe('invokeStringMethod — replace', () => {
  it('replace replaces every occurrence and treats the target literally', () => {
    expect(call('aXbXc', 'replace', 'X', '-')).toBe('a-b-c');
    expect(call('a.b.c', 'replace', '.', '-')).toBe('a-b-c');
  });

  it('replace with an empty target inserts at every boundary', () => {
    expect(call('abc', 'replace', '', '-')).toBe('-a-b-c-');
  });

  it('replaceAll and replaceFirst take a regular expression', () => {
    expect(call('a1b2', 'replaceAll', '\\d', '-')).toBe('a-b-');
    expect(call('a1b2', 'replaceFirst', '\\d', '-')).toBe('a-b2');
  });

  it('matches requires the whole input to match', () => {
    expect(call('abc', 'matches', 'a.*')).toBe(true);
    expect(call('abc', 'matches', 'b')).toBe(false);
    expect(call('a1b2', 'matches', '\\d')).toBe(false);
  });

  it('reports a flawed pattern rather than throwing a syntax error', () => {
    expect(() => call('abc', 'matches', '[')).toThrow(SpelEvaluationException);
    expect(() => call('abc', 'replaceAll', '(', '-')).toThrow(SpelEvaluationException);
  });
});

describe('invokeStringMethod — split', () => {
  it('takes a regular expression', () => {
    expect(call('a1b2', 'split', '\\d')).toEqual(['a', 'b']);
  });

  it('discards trailing empty strings when no limit is given', () => {
    expect(call('a,b,', 'split', ',')).toEqual(['a', 'b']);
    expect(call('a,b,,c', 'split', ',')).toEqual(['a', 'b', '', 'c']);
  });

  it('keeps every element for a negative limit', () => {
    expect(call('a,b,', 'split', ',', -1)).toEqual(['a', 'b', '']);
  });

  it('treats a zero limit like no limit', () => {
    expect(call('a,b,', 'split', ',', 0)).toEqual(['a', 'b']);
  });

  it('bounds the number of applications for a positive limit', () => {
    expect(call('a,b,c', 'split', ',', 2)).toEqual(['a', 'b,c']);
    expect(call('a,b,', 'split', ',', 5)).toEqual(['a', 'b', '']);
  });

  it('returns the input unchanged when it is empty', () => {
    expect(call('', 'split', ',')).toEqual(['']);
  });

  it('handles a zero-width pattern without a leading empty element', () => {
    expect(call('abc', 'split', '', 2)).toEqual(['a', 'bc']);
    expect(call('abc', 'split', '')).toEqual(['a', 'b', 'c']);
    expect(call('abc', 'split', '(?=b)', 2)).toEqual(['a', 'bc']);
  });
});
