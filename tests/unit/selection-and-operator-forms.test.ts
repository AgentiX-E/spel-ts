/**
 * Contract tests for the collection-selection and keyword-operator forms.
 *
 * SpEL writes selection and projection five different ways — `.?[` for a filter, `.![` for a
 * projection, and `.$[` / `.^[` for the first and last match — plus the empty-predicate form,
 * which means "take everything" rather than "match everything". The parser carries a separate
 * branch for each, and the mode is what distinguishes them, so a suite that only ever writes
 * `.?[` leaves four of the five unattested.
 *
 * The keyword operators are the other half: `matches` and `instanceof` are part of the grammar
 * and are reached through a different path from the symbolic forms.
 */
import { describe, expect, it } from 'vitest';
import { SpelExpressionParser, SpelParseException } from '../../src/index.js';

const parser = new SpelExpressionParser();

describe('selection and projection forms', () => {
  it('.?[...] selects the elements the predicate accepts', () => {
    expect(parser.parseExpression('{1, 2, 3, 4}.?[#this > 2]').getValue()).toEqual([3, 4]);
  });

  it('.![...] projects the elements through the expression', () => {
    expect(parser.parseExpression('{1, 2, 3}.![#this * 2]').getValue()).toEqual([2, 4, 6]);
  });

  it('.![] with an empty predicate projects the substituted literal', () => {
    // A projection yields the *predicate's* value, not the element. With no predicate the parser
    // substitutes a literal true, so the result is one true per element rather than the list
    // itself — the branch matters because a null predicate would fail the whole expression.
    expect(parser.parseExpression('{1, 2, 3}.![]').getValue()).toEqual([true, true, true]);
  });

  it('.?[] with an empty predicate selects every element', () => {
    expect(parser.parseExpression('{1, 2, 3}.?[]').getValue()).toEqual([1, 2, 3]);
  });

  it('.^[...] selects the first match and .$[...] the last', () => {
    // Spring's mapping, which this follows: `^` is the first element the predicate accepts and
    // `$` is the last. Getting these the wrong way round is the easy mistake, so both are
    // asserted against the same list in one place instead of in two tests that could drift.
    expect(parser.parseExpression('{1, 2, 3, 4}.^[#this > 1]').getValue()).toBe(2);
    expect(parser.parseExpression('{1, 2, 3, 4}.$[#this > 1]').getValue()).toBe(4);
  });

  it('a selection that matches nothing yields an empty list', () => {
    expect(parser.parseExpression('{1, 2, 3}.?[#this > 99]').getValue()).toEqual([]);
  });

  it('a projection over a list of strings keeps the element type', () => {
    expect(parser.parseExpression("{'a', 'b'}.![#this.toUpperCase()]").getValue()).toEqual([
      'A',
      'B',
    ]);
  });
});

describe('keyword operator forms', () => {
  it('`matches` accepts a regular expression', () => {
    expect(parser.parseExpression("'abcdef' matches '^a.*f$'").getValue()).toBe(true);
    expect(parser.parseExpression("'abcdef' matches '^b.*'").getValue()).toBe(false);
  });

  it('`instanceof` compares against a resolved type', () => {
    expect(parser.parseExpression('1 instanceof T(Integer)').getValue()).toBe(true);
    expect(parser.parseExpression("'x' instanceof T(Integer)").getValue()).toBe(false);
  });

  it('rejects `=~`, which is not a SpEL operator', () => {
    // `=~` is Groovy's match operator; SpEL spells it `matches`. The tokenizer refuses the `~`
    // rather than treating it as something else, which is what makes the rejection trustworthy.
    expect(() => parser.parseExpression("'abc' =~ '^a'")).toThrow(SpelParseException);
  });
});
