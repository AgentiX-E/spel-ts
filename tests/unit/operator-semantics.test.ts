/**
 * Contract tests for operator semantics that the corpus reaches only indirectly.
 *
 * The equality rules and the unary-minus rendering are both small, precise
 * behaviours where a wrong branch is easy to introduce and hard to notice, so
 * they are exercised directly as well as through expressions.
 */
import { describe, expect, it } from 'vitest';
import { equalityCheck } from '../../src/ast/operator/equality.js';
import { SpelExpressionParser } from '../../src/spel-expression-parser.js';
import { StandardEvaluationContext } from '../../src/standard-evaluation-context.js';

describe('equalityCheck', () => {
  it('treats null as equal only to null', () => {
    expect(equalityCheck(null, null)).toBe(true);
    expect(equalityCheck(undefined, undefined)).toBe(true);
    expect(equalityCheck(null, 0)).toBe(false);
    expect(equalityCheck(0, null)).toBe(false);
    expect(equalityCheck(null, '')).toBe(false);
  });

  it('compares two numbers numerically', () => {
    expect(equalityCheck(1, 1)).toBe(true);
    expect(equalityCheck(1, 2)).toBe(false);
    expect(equalityCheck(1, 1.0)).toBe(true);
  });

  it('compares two strings by value', () => {
    expect(equalityCheck('abc', 'abc')).toBe(true);
    expect(equalityCheck('abc', 'abd')).toBe(false);
    expect(equalityCheck('', '')).toBe(true);
  });

  it('compares two booleans by value', () => {
    expect(equalityCheck(true, true)).toBe(true);
    expect(equalityCheck(false, false)).toBe(true);
    expect(equalityCheck(true, false)).toBe(false);
  });

  it('never equates values from different type families', () => {
    expect(equalityCheck('1', 1)).toBe(false);
    expect(equalityCheck(1, '1')).toBe(false);
    expect(equalityCheck(true, 1)).toBe(false);
    expect(equalityCheck(1, true)).toBe(false);
    expect(equalityCheck(false, 0)).toBe(false);
    expect(equalityCheck('true', true)).toBe(false);
  });

  it('falls back to reference identity for other types', () => {
    const shared = { id: 1 };
    expect(equalityCheck(shared, shared)).toBe(true);
    expect(equalityCheck({ id: 1 }, { id: 1 })).toBe(false);

    const list = [1, 2];
    expect(equalityCheck(list, list)).toBe(true);
    expect(equalityCheck([1, 2], [1, 2])).toBe(false);
  });
});

describe('collection selection modes', () => {
  const parser = new SpelExpressionParser();
  const root = {
    items: [
      { name: 'a', price: 10 },
      { name: 'b', price: 200 },
      { name: 'c', price: 30 },
    ],
  };

  const evaluate = (expr: string): unknown =>
    parser.parseExpression(expr).getValueWithContext(new StandardEvaluationContext(root));

  it('binds ^[ to the first match, as Spring does', () => {
    expect(evaluate('items.^[price > 20]')).toEqual({ name: 'b', price: 200 });
  });

  it('binds $[ to the last match, as Spring does', () => {
    // This previously returned the first match, because both modifiers mapped
    // to SELECT_FIRST and the non-SpEL '.*[' was treated as select-last.
    expect(evaluate('items.$[price > 20]')).toEqual({ name: 'c', price: 30 });
  });

  it('rejects the non-SpEL .*[ modifier', () => {
    expect(() => parser.parseExpression('items.*[price > 20]')).toThrow();
  });

  it('agrees between the compact and dotted spellings', () => {
    // The dotted spelling reaches a separate parsing path; a stray token advance
    // there used to make `items. .![name]` evaluate to [true, true].
    expect(evaluate('items. .?[price > 20]')).toEqual(evaluate('items.?[price > 20]'));
    expect(evaluate('items. .![name]')).toEqual(evaluate('items.![name]'));
    expect(evaluate('items. .^[price > 20]')).toEqual(evaluate('items.^[price > 20]'));
  });
});

describe('toStringAST round-trip', () => {
  const parser = new SpelExpressionParser();

  // Each rendering must parse back to the same value. The unary and between
  // forms previously rendered as `(true ! )` and `(1 between 1)`, neither of
  // which parses, so this property would have caught both.
  const roundTrippable = [
    'not true',
    '1 between {1, 5}',
    '5 - 3',
    '-3',
    '2 ^ 3',
    'true and false',
    '1 + 2 * 3',
  ];

  for (const expression of roundTrippable) {
    it(`re-parses ${expression}`, () => {
      const rendered = parser.parseRaw(expression).toStringAST();
      expect(parser.parseExpression(rendered).getValue()).toBe(
        parser.parseExpression(expression).getValue(),
      );
    });
  }
});

describe('unary minus rendering', () => {
  const parser = new SpelExpressionParser();

  it('renders a prefix negation with a single operand', () => {
    expect(parser.parseRaw('-3').toStringAST()).toBe('(-3)');
    expect(parser.parseRaw('-3.5').toStringAST()).toBe('(-3.5)');
    expect(parser.parseRaw('-(2 + 1)').toStringAST()).toBe('(-(2 + 1))');
  });

  it('renders binary subtraction unchanged', () => {
    expect(parser.parseRaw('5 - 3').toStringAST()).toBe('(5 - 3)');
  });

  it('distinguishes a genuine null subtraction from prefix negation', () => {
    expect(parser.parseRaw('null - 3').toStringAST()).toBe('(null - 3)');
  });
});
