/**
 * Unit tests for the ASCII case-folding helpers.
 *
 * These exist because the folding rule decides when a scanned identifier counts
 * as a textual operator, so it is correctness-relevant. The tests pin the two
 * properties that make it safe: folding never changes string length, and it
 * never depends on the host locale.
 */
import { describe, expect, it } from 'vitest';
import { equalsIgnoreCaseAscii, foldAsciiUpper } from '../../src/util/ascii.js';

describe('foldAsciiUpper', () => {
  it('returns the empty string unchanged', () => {
    expect(foldAsciiUpper('')).toBe('');
  });

  it('folds lower-case ASCII letters to upper case', () => {
    expect(foldAsciiUpper('div')).toBe('DIV');
    expect(foldAsciiUpper('and')).toBe('AND');
  });

  it('leaves already upper-case text unchanged', () => {
    expect(foldAsciiUpper('DIV')).toBe('DIV');
  });

  it('folds mixed case to one canonical form', () => {
    expect(foldAsciiUpper('DiV')).toBe('DIV');
    expect(foldAsciiUpper('bEtWeEn')).toBe('BETWEEN');
  });

  it('leaves text with no letters unchanged', () => {
    expect(foldAsciiUpper('123')).toBe('123');
    expect(foldAsciiUpper('_$')).toBe('_$');
  });

  it('short-circuits on non-ASCII input without folding anything', () => {
    expect(foldAsciiUpper('年龄')).toBe('年龄');
    expect(foldAsciiUpper('café')).toBe('café');
    expect(foldAsciiUpper('div年龄')).toBe('div年龄');
    expect(foldAsciiUpper('αβγ')).toBe('αβγ');
  });

  it('does not expand characters whose upper case has a different length', () => {
    // String.prototype.toUpperCase would turn this into 'SS', changing length.
    expect(foldAsciiUpper('ß')).toBe('ß');
    expect(foldAsciiUpper('straße')).toHaveLength('straße'.length);
  });

  it('is locale independent', () => {
    // Under the Turkish locale toUpperCase('i') is 'İ', which would break
    // keyword lookup. An ASCII fold is immune.
    expect(foldAsciiUpper('div')).toBe('DIV');
    expect(foldAsciiUpper('i')).toBe('I');
  });

  it('preserves length for every input', () => {
    for (const sample of ['', 'div', 'DIV', '年龄', 'café', 'ß', 'a1_$']) {
      expect(foldAsciiUpper(sample), `length changed for ${sample}`).toHaveLength(sample.length);
    }
  });
});

describe('equalsIgnoreCaseAscii', () => {
  it('matches across case', () => {
    expect(equalsIgnoreCaseAscii('and', 'AND')).toBe(true);
    expect(equalsIgnoreCaseAscii('div', 'DIV')).toBe(true);
    expect(equalsIgnoreCaseAscii('Div', 'dIv')).toBe(true);
  });

  it('rejects different words', () => {
    expect(equalsIgnoreCaseAscii('and', 'or')).toBe(false);
    expect(equalsIgnoreCaseAscii('matches', 'match')).toBe(false);
  });

  it('matches identical non-ASCII text without folding', () => {
    expect(equalsIgnoreCaseAscii('年龄', '年龄')).toBe(true);
    expect(equalsIgnoreCaseAscii('年龄', '姓名')).toBe(false);
  });

  it('does not treat non-ASCII as equal to an ASCII keyword', () => {
    expect(equalsIgnoreCaseAscii('and', 'ånd')).toBe(false);
  });
});
