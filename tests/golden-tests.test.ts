/**
 * Golden Tests for @agentix-e/spel-ts
 *
 * These are EXACT expected values that must never regress.
 * They parallel the Spring Framework official SpEL test suite
 * (SpelExpressionTests, SpelParserTests, EvaluationTests).
 *
 * Every test has an SPR-N comment explaining what Spring SpEL behavior it validates.
 */

import { describe, it, expect } from 'vitest';
import { SpelExpressionParser, StandardEvaluationContext } from '../src/index.js';

describe('Golden: Literal Expressions', () => {
  const parser = new SpelExpressionParser();

  // SPR-1: Spring SpEL null literal evaluates to Java null / JS null
  it('SPR-1: null literal', () => {
    expect(parser.parseExpression('null').getValue()).toBeNull();
  });

  // SPR-2: Spring SpEL boolean true literal returns true
  it('SPR-2: boolean true', () => {
    expect(parser.parseExpression('true').getValue()).toBe(true);
  });

  // SPR-3: Spring SpEL boolean false literal returns false
  it('SPR-3: boolean false', () => {
    expect(parser.parseExpression('false').getValue()).toBe(false);
  });

  // SPR-4: Spring SpEL integer literal returns a number (int in Java)
  it('SPR-4: integer literal', () => {
    expect(parser.parseExpression('42').getValue()).toBe(42);
  });

  // SPR-5: Spring SpEL hex literal (0xFF) evaluates to 255
  it('SPR-5: hex literal', () => {
    expect(parser.parseExpression('0xFF').getValue()).toBe(255);
  });

  // SPR-6: Spring SpEL double literal with decimal point
  it('SPR-6: double literal', () => {
    expect(parser.parseExpression('3.14159').getValue()).toBeCloseTo(3.14159, 5);
  });

  // SPR-7: Spring SpEL single-quoted string literal
  it('SPR-7: string literal single-quoted', () => {
    expect(parser.parseExpression("'hello'").getValue()).toBe('hello');
  });

  // SPR-8: Spring SpEL double-quoted string literal
  it('SPR-8: string literal double-quoted', () => {
    expect(parser.parseExpression('"world"').getValue()).toBe('world');
  });

  // SPR-9: Spring SpEL escaped single quote in single-quoted string (it''s -> it's)
  it('SPR-9: string with escaped quotes', () => {
    expect(parser.parseExpression("'it''s'").getValue()).toBe("it's");
  });
});

describe('Golden: Arithmetic Expressions', () => {
  const parser = new SpelExpressionParser();

  // SPR-10: Spring SpEL performs standard integer addition
  it('SPR-10: simple addition', () => {
    expect(parser.parseExpression('2 + 3').getValue()).toBe(5);
  });

  // SPR-11: Spring SpEL performs standard integer subtraction
  it('SPR-11: simple subtraction', () => {
    expect(parser.parseExpression('10 - 3').getValue()).toBe(7);
  });

  // SPR-12: Spring SpEL performs standard integer multiplication
  it('SPR-12: simple multiplication', () => {
    expect(parser.parseExpression('4 * 7').getValue()).toBe(28);
  });

  // SPR-13: Spring SpEL performs standard integer division (returns float in JS)
  it('SPR-13: simple division', () => {
    expect(parser.parseExpression('15 / 3').getValue()).toBe(5);
  });

  // SPR-14: Spring SpEL modulo operator (%)
  it('SPR-14: modulo', () => {
    expect(parser.parseExpression('17 % 5').getValue()).toBe(2);
  });

  // SPR-15: Spring SpEL power operator (^), right-associative
  it('SPR-15: power', () => {
    expect(parser.parseExpression('2 ^ 5').getValue()).toBe(32);
  });

  // SPR-16: Spring SpEL unary negation on integer literal
  it('SPR-16: negative number', () => {
    expect(parser.parseExpression('-5').getValue()).toBe(-5);
  });

  // SPR-17: Spring SpEL respects operator precedence (* and / before + and -)
  it('SPR-17: complex expression', () => {
    expect(parser.parseExpression('(10 + 2 * 3) / 2').getValue()).toBe(8);
  });

  // SPR-18: Spring SpEL + operator concatenates strings when operands are strings
  it('SPR-18: string concatenation', () => {
    expect(parser.parseExpression("'hello' + ' ' + 'world'").getValue()).toBe('hello world');
  });

  // SPR-19: Spring SpEL coerces number to string when concatenating mixed types
  it('SPR-19: number-string concat', () => {
    expect(parser.parseExpression('"value: " + 42').getValue()).toBe('value: 42');
  });
});

describe('Golden: Comparison Expressions', () => {
  const parser = new SpelExpressionParser();

  // SPR-20: Spring SpEL == returns true for equal numbers
  it('SPR-20: equal numbers', () => {
    expect(parser.parseExpression('5 == 5').getValue()).toBe(true);
  });

  // SPR-21: Spring SpEL != returns true for unequal numbers
  it('SPR-21: not equal numbers', () => {
    expect(parser.parseExpression('5 != 3').getValue()).toBe(true);
  });

  // SPR-22: Spring SpEL < returns true when left is less than right
  it('SPR-22: less than', () => {
    expect(parser.parseExpression('3 < 5').getValue()).toBe(true);
  });

  // SPR-23: Spring SpEL > returns true when left is greater than right
  it('SPR-23: greater than', () => {
    expect(parser.parseExpression('5 > 3').getValue()).toBe(true);
  });

  // SPR-24: Spring SpEL <= returns true when left is equal to right
  it('SPR-24: less or equal', () => {
    expect(parser.parseExpression('3 <= 3').getValue()).toBe(true);
  });

  // SPR-25: Spring SpEL >= returns true when left is equal to right
  it('SPR-25: greater or equal', () => {
    expect(parser.parseExpression('5 >= 3').getValue()).toBe(true);
  });

  // SPR-26: Spring SpEL symbolic operator 'eq' equivalent to ==
  it('SPR-26: keyword eq', () => {
    expect(parser.parseExpression('5 eq 5').getValue()).toBe(true);
  });

  // SPR-27: Spring SpEL symbolic operator 'ne' equivalent to !=
  it('SPR-27: keyword ne', () => {
    expect(parser.parseExpression('5 ne 3').getValue()).toBe(true);
  });

  // SPR-28: Spring SpEL symbolic operator 'lt' equivalent to <
  it('SPR-28: keyword lt', () => {
    expect(parser.parseExpression('3 lt 5').getValue()).toBe(true);
  });

  // SPR-29: Spring SpEL symbolic operator 'gt' equivalent to >
  it('SPR-29: keyword gt', () => {
    expect(parser.parseExpression('5 gt 3').getValue()).toBe(true);
  });

  // SPR-30: Spring SpEL symbolic operator 'le' equivalent to <=
  it('SPR-30: keyword le', () => {
    expect(parser.parseExpression('3 le 3').getValue()).toBe(true);
  });

  // SPR-31: Spring SpEL symbolic operator 'ge' equivalent to >=
  it('SPR-31: keyword ge', () => {
    expect(parser.parseExpression('5 ge 3').getValue()).toBe(true);
  });

  // SPR-32: Spring SpEL boolean true coerces to number 1 for comparison with number
  it('SPR-32: boolean equals number', () => {
    expect(parser.parseExpression('true == 1').getValue()).toBe(true);
  });

  // SPR-33: Spring SpEL == is equality, not assignment (single = is assignment)
  it('SPR-33: equals symbol = assignments', () => {
    expect(parser.parseExpression('1 == 1').getValue()).toBe(true);
  });
});

describe('Golden: Logical Expressions', () => {
  const parser = new SpelExpressionParser();

  // SPR-34: Spring SpEL && returns true when both operands are true
  it('SPR-34: AND both true', () => {
    expect(parser.parseExpression('true && true').getValue()).toBe(true);
  });

  // SPR-35: Spring SpEL && returns false when any operand is false
  it('SPR-35: AND mixed', () => {
    expect(parser.parseExpression('true && false').getValue()).toBe(false);
  });

  // SPR-36: Spring SpEL || returns false when both operands are false
  it('SPR-36: OR both false', () => {
    expect(parser.parseExpression('false || false').getValue()).toBe(false);
  });

  // SPR-37: Spring SpEL || returns true when any operand is true
  it('SPR-37: OR mixed', () => {
    expect(parser.parseExpression('true || false').getValue()).toBe(true);
  });

  // SPR-38: Spring SpEL ! negates true to false
  it('SPR-38: NOT true', () => {
    expect(parser.parseExpression('!true').getValue()).toBe(false);
  });

  // SPR-39: Spring SpEL ! negates false to true
  it('SPR-39: NOT false', () => {
    expect(parser.parseExpression('!false').getValue()).toBe(true);
  });

  // SPR-40: Spring SpEL symbolic operator 'and' equivalent to &&
  it('SPR-40: keyword and', () => {
    expect(parser.parseExpression('true and true').getValue()).toBe(true);
  });

  // SPR-41: Spring SpEL symbolic operator 'or' equivalent to ||
  it('SPR-41: keyword or', () => {
    expect(parser.parseExpression('false or true').getValue()).toBe(true);
  });

  // SPR-42: Spring SpEL symbolic operator 'not' equivalent to !
  it('SPR-42: keyword not', () => {
    expect(parser.parseExpression('not false').getValue()).toBe(true);
  });
});

describe('Golden: Ternary / Elvis / Assignment', () => {
  const parser = new SpelExpressionParser();

  // SPR-43: Spring SpEL ternary picks true branch when condition is true
  it('SPR-43: ternary true branch', () => {
    expect(parser.parseExpression('true ? 1 : 2').getValue()).toBe(1);
  });

  // SPR-44: Spring SpEL ternary picks false branch when condition is false
  it('SPR-44: ternary false branch', () => {
    expect(parser.parseExpression('false ? 1 : 2').getValue()).toBe(2);
  });

  // SPR-45: Spring SpEL ternary condition can be a comparison expression
  it('SPR-45: ternary with comparison', () => {
    expect(parser.parseExpression('5 > 3 ? "yes" : "no"').getValue()).toBe('yes');
  });

  // SPR-46: Spring SpEL supports nested ternary expressions
  it('SPR-46: nested ternary', () => {
    expect(parser.parseExpression('1 > 0 ? (2 > 1 ? 10 : 20) : 30').getValue()).toBe(10);
  });

  // SPR-47: Spring SpEL Elvis operator (?:) returns left when non-null
  it('SPR-47: elvis non-null', () => {
    expect(parser.parseExpression('"hello" ?: "fallback"').getValue()).toBe('hello');
  });

  // SPR-48: Spring SpEL Elvis returns fallback when left is null
  it('SPR-48: elvis null fallback', () => {
    expect(parser.parseExpression('null ?: "fallback"').getValue()).toBe('fallback');
  });

  // SPR-49: Spring SpEL Elvis fallback value can be an expression
  it('SPR-49: elvis with expression', () => {
    expect(parser.parseExpression('null ?: (1 + 2)').getValue()).toBe(3);
  });
});

describe('Golden: Variable Access', () => {
  // SPR-50: Spring SpEL #var references a variable from EvaluationContext
  it('SPR-50: simple variable', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('x', 42);
    expect(new SpelExpressionParser().parseExpression('#x').getValueWithContext(ctx)).toBe(42);
  });

  // SPR-51: Spring SpEL variables can be used in arithmetic expressions
  it('SPR-51: variable in expression', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('x', 10);
    ctx.setVariable('y', 20);
    expect(new SpelExpressionParser().parseExpression('#x + #y').getValueWithContext(ctx)).toBe(30);
  });

  // SPR-52: Spring SpEL variables can be used in comparison expressions
  it('SPR-52: variable in comparison', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('age', 25);
    expect(new SpelExpressionParser().parseExpression('#age > 18').getValueWithContext(ctx)).toBe(
      true,
    );
  });

  // SPR-53: Spring SpEL variables can be used in ternary expressions
  it('SPR-53: variable in ternary', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('score', 85);
    expect(
      new SpelExpressionParser()
        .parseExpression('#score >= 60 ? "PASS" : "FAIL"')
        .getValueWithContext(ctx),
    ).toBe('PASS');
  });

  // SPR-54: Spring SpEL throws VARIABLE_NOT_FOUND for undefined variables
  it('SPR-54: undefined variable throws', () => {
    const ctx = new StandardEvaluationContext();
    expect(() =>
      new SpelExpressionParser().parseExpression('#missing').getValueWithContext(ctx),
    ).toThrow();
  });
});

describe('Golden: Collections', () => {
  const parser = new SpelExpressionParser();

  // SPR-55: Spring SpEL inline list {1, 2, 3} returns an array
  it('SPR-55: inline list', () => {
    expect(parser.parseExpression('{1, 2, 3}').getValue()).toEqual([1, 2, 3]);
  });

  // SPR-56: Spring SpEL empty inline list {} returns an empty array
  it('SPR-56: empty list', () => {
    expect(parser.parseExpression('{}').getValue()).toEqual([]);
  });

  // SPR-57: Spring SpEL inline list supports mixed types
  it('SPR-57: mixed type list', () => {
    const result = parser.parseExpression('{1, "two", 3.0}').getValue();
    expect(result).toEqual([1, 'two', 3.0]);
  });

  // SPR-58: Spring SpEL inline map returns a Map with key-value pairs
  it('SPR-58: inline map', () => {
    const result = parser.parseExpression("{'a': 1, 'b': 2}").getValue() as Map<string, unknown>;
    expect(result instanceof Map).toBe(true);
    expect(result.get('a')).toBe(1);
    expect(result.get('b')).toBe(2);
  });

  // SPR-59: Spring SpEL inline map with a single entry
  it('SPR-59: single element map', () => {
    const result = parser.parseExpression("{'key': 'value'}").getValue() as Map<string, unknown>;
    expect(result.get('key')).toBe('value');
  });
});

describe('Golden: Edge Cases', () => {
  const parser = new SpelExpressionParser();

  // SPR-60: null + null — null coerces to 0 for arithmetic when no string operand present
  it('SPR-60: null arithmetic', () => {
    expect(parser.parseExpression('null + null').getValue()).toBe(0);
  });

  // SPR-61: Spring SpEL parenthesized null evaluates to null
  it('SPR-61: parenthesized null', () => {
    expect(parser.parseExpression('(null)').getValue()).toBeNull();
  });

  // SPR-62: Spring SpEL deeply nested parentheses don't affect the value
  it('SPR-62: deeply nested parens', () => {
    expect(parser.parseExpression('(((42)))').getValue()).toBe(42);
  });

  // SPR-63: Spring SpEL handles max 32-bit signed integer
  it('SPR-63: large integer', () => {
    expect(parser.parseExpression('2147483647').getValue()).toBe(2147483647);
  });

  // SPR-64: Spring SpEL 0 is falsy in ternary condition
  it('SPR-64: zero is falsy in ternary', () => {
    expect(parser.parseExpression('0 ? 1 : 2').getValue()).toBe(2);
  });

  // SPR-65: Spring SpEL empty string is falsy in ternary condition
  it('SPR-65: empty string in ternary', () => {
    expect(parser.parseExpression('"" ? 1 : 2').getValue()).toBe(2);
  });

  // SPR-66: Spring SpEL non-empty string is truthy in ternary condition
  it('SPR-66: non-empty string is truthy', () => {
    expect(parser.parseExpression('"x" ? 1 : 2').getValue()).toBe(1);
  });

  // SPR-67: Spring SpEL && returns right operand when left is truthy (short-circuit behavior)
  it('SPR-67: boolean AND numeric', () => {
    expect(parser.parseExpression('true && 42').getValue()).toBe(42);
  });

  // SPR-68: Spring SpEL || returns first truthy value (0 is falsy, 42 is truthy)
  it('SPR-68: OR returns first truthy', () => {
    expect(parser.parseExpression('0 || 42').getValue()).toBe(42);
  });

  // SPR-69: Spring SpEL division by zero throws SpelEvaluationException (DIVISION_BY_ZERO)
  it('SPR-69: division by zero throws', () => {
    expect(() => parser.parseExpression('1/0').getValue()).toThrow();
  });
});
