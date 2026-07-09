import { describe, it, expect, beforeEach } from 'vitest';
import { SpelExpressionParser } from '../src/spel-expression-parser.js';
import { StandardEvaluationContext } from '../src/standard-evaluation-context.js';

describe('Phase 2 — Full SpEL Expression Evaluation', () => {
  let parser: SpelExpressionParser;

  beforeEach(() => {
    parser = new SpelExpressionParser();
  });

  // ==================== ARITHMETIC ====================
  describe('arithmetic operators', () => {
    describe('addition (+)', () => {
      it('2 + 3 = 5', () => {
        expect(parser.parseExpression('2 + 3').getValue()).toBe(5);
      });

      it('string concat', () => {
        expect(parser.parseExpression("'hello' + ' world'").getValue()).toBe('hello world');
      });

      it('number + string → string', () => {
        expect(parser.parseExpression('42 + " apples"').getValue()).toBe('42 apples');
      });

      it('multiple additions', () => {
        expect(parser.parseExpression('1 + 2 + 3').getValue()).toBe(6);
      });
    });

    describe('subtraction (-)', () => {
      it('5 - 3 = 2', () => {
        expect(parser.parseExpression('5 - 3').getValue()).toBe(2);
      });

      it('negative result', () => {
        expect(parser.parseExpression('3 - 5').getValue()).toBe(-2);
      });

      it('unary negation', () => {
        expect(parser.parseExpression('-5').getValue()).toBe(-5);
      });

      it('double negation: -(-5) = 5', () => {
        // --5 is tokenized as DEC (decrement), not unary minus × 2
        // Use explicit parens for double negation
        expect(parser.parseExpression('-(-5)').getValue()).toBe(5);
      });
    });

    describe('multiplication (*)', () => {
      it('4 * 3 = 12', () => {
        expect(parser.parseExpression('4 * 3').getValue()).toBe(12);
      });

      it('5 * 0 = 0', () => {
        expect(parser.parseExpression('5 * 0').getValue()).toBe(0);
      });
    });

    describe('division (/)', () => {
      it('10 / 2 = 5', () => {
        expect(parser.parseExpression('10 / 2').getValue()).toBe(5);
      });

      it('7 / 2 = 3.5', () => {
        expect(parser.parseExpression('7 / 2').getValue()).toBe(3.5);
      });

      it('throws on divide by zero', () => {
        expect(() => parser.parseExpression('1 / 0').getValue()).toThrow();
      });
    });

    describe('modulus (%)', () => {
      it('10 % 3 = 1', () => {
        expect(parser.parseExpression('10 % 3').getValue()).toBe(1);
      });

      it('10 mod 3 = 1', () => {
        expect(parser.parseExpression('10 mod 3').getValue()).toBe(1);
      });
    });

    describe('power (^)', () => {
      it('2 ^ 3 = 8', () => {
        expect(parser.parseExpression('2 ^ 3').getValue()).toBe(8);
      });

      it('right-associative', () => {
        expect(parser.parseExpression('2 ^ 3 ^ 2').getValue()).toBe(512);
      });
    });

    describe('operator precedence', () => {
      it('mul before add: 2 + 3 * 4 = 14', () => {
        expect(parser.parseExpression('2 + 3 * 4').getValue()).toBe(14);
      });

      it('parens override: (2 + 3) * 4 = 20', () => {
        expect(parser.parseExpression('(2 + 3) * 4').getValue()).toBe(20);
      });

      it('complex precedence', () => {
        expect(parser.parseExpression('10 - 2 * 3 + 4').getValue()).toBe(8);
      });
    });
  });

  // ==================== COMPARISON ====================
  describe('comparison operators', () => {
    describe('equality (==)', () => {
      it('5 == 5 → true', () => {
        expect(parser.parseExpression('5 == 5').getValue()).toBe(true);
      });

      it('5 == 3 → false', () => {
        expect(parser.parseExpression('5 == 3').getValue()).toBe(false);
      });

      it("'hello' == 'hello' → true", () => {
        expect(parser.parseExpression("'hello' == 'hello'").getValue()).toBe(true);
      });

      it('5 eq 5 → true', () => {
        expect(parser.parseExpression('5 eq 5').getValue()).toBe(true);
      });
    });

    describe('not equal (!=)', () => {
      it('5 != 3 → true', () => {
        expect(parser.parseExpression('5 != 3').getValue()).toBe(true);
      });

      it('5 != 5 → false', () => {
        expect(parser.parseExpression('5 != 5').getValue()).toBe(false);
      });

      it('5 ne 3 → true', () => {
        expect(parser.parseExpression('5 ne 3').getValue()).toBe(true);
      });
    });

    describe('less than (<)', () => {
      it('3 < 5 → true', () => {
        expect(parser.parseExpression('3 < 5').getValue()).toBe(true);
      });

      it('5 < 3 → false', () => {
        expect(parser.parseExpression('5 < 3').getValue()).toBe(false);
      });

      it('3 lt 5 → true', () => {
        expect(parser.parseExpression('3 lt 5').getValue()).toBe(true);
      });
    });

    describe('less or equal (<=)', () => {
      it('3 <= 3 → true', () => {
        expect(parser.parseExpression('3 <= 3').getValue()).toBe(true);
      });

      it('3 le 3 → true', () => {
        expect(parser.parseExpression('3 le 3').getValue()).toBe(true);
      });
    });

    describe('greater than (>)', () => {
      it('5 > 3 → true', () => {
        expect(parser.parseExpression('5 > 3').getValue()).toBe(true);
      });

      it('5 gt 3 → true', () => {
        expect(parser.parseExpression('5 gt 3').getValue()).toBe(true);
      });
    });

    describe('greater or equal (>=)', () => {
      it('5 >= 5 → true', () => {
        expect(parser.parseExpression('5 >= 5').getValue()).toBe(true);
      });

      it('5 ge 5 → true', () => {
        expect(parser.parseExpression('5 ge 5').getValue()).toBe(true);
      });
    });
  });

  // ==================== LOGICAL ====================
  describe('logical operators', () => {
    describe('AND (&&)', () => {
      it('true && true → true', () => {
        expect(parser.parseExpression('true && true').getValue()).toBe(true);
      });

      it('true && false → false', () => {
        expect(parser.parseExpression('true && false').getValue()).toBe(false);
      });

      it('true and true → true', () => {
        expect(parser.parseExpression('true and true').getValue()).toBe(true);
      });

      it('short-circuit: left falsy, right not evaluated', () => {
        expect(parser.parseExpression('false && 42').getValue()).toBe(false);
      });
    });

    describe('OR (||)', () => {
      it('true || false → true', () => {
        expect(parser.parseExpression('true || false').getValue()).toBe(true);
      });

      it('false || true → true', () => {
        expect(parser.parseExpression('false || true').getValue()).toBe(true);
      });

      it('false or true → true', () => {
        expect(parser.parseExpression('false or true').getValue()).toBe(true);
      });

      it('false || false → false', () => {
        expect(parser.parseExpression('false || false').getValue()).toBe(false);
      });
    });

    describe('NOT (!)', () => {
      it('!true → false', () => {
        expect(parser.parseExpression('!true').getValue()).toBe(false);
      });

      it('!false → true', () => {
        expect(parser.parseExpression('!false').getValue()).toBe(true);
      });

      it('not true → false', () => {
        expect(parser.parseExpression('not true').getValue()).toBe(false);
      });
    });
  });

  // ==================== CONDITIONAL ====================
  describe('conditional operators', () => {
    describe('ternary (? :)', () => {
      it('true ? 1 : 2 → 1', () => {
        expect(parser.parseExpression('true ? 1 : 2').getValue()).toBe(1);
      });

      it('false ? 1 : 2 → 2', () => {
        expect(parser.parseExpression('false ? 1 : 2').getValue()).toBe(2);
      });

      it('nested ternary', () => {
        const result = parser.parseExpression('1 > 0 ? 2 > 1 ? 10 : 20 : 30').getValue();
        expect(result).toBe(10);
      });
    });

    describe('elvis (?:)', () => {
      it("non-null left: 'hello' ?: 'fallback' → 'hello'", () => {
        expect(parser.parseExpression("'hello' ?: 'fallback'").getValue()).toBe('hello');
      });

      it("null ?: 'fallback' → 'fallback'", () => {
        expect(parser.parseExpression("null ?: 'fallback'").getValue()).toBe('fallback');
      });
    });
  });

  // ==================== SPECIAL OPERATORS ====================
  describe('special operators', () => {
    describe('matches', () => {
      it("'hello' matches '^h.*$' → true", () => {
        expect(parser.parseExpression("'hello' matches '^h.*$'").getValue()).toBe(true);
      });

      it("'world' matches '^h.*$' → false", () => {
        expect(parser.parseExpression("'world' matches '^h.*$'").getValue()).toBe(false);
      });
    });

    describe('between', () => {
      it('5 between {1, 10} → true (list form)', () => {
        const result = parser.parseExpression('5 between {1, 10}').getValue();
        expect(result).toBe(true);
      });

      it('0 between 1 and 10 → false (and form)', () => {
        const result = parser.parseExpression('0 between 1 and 10').getValue();
        expect(result).toBe(false);
      });

      it('boundary: 1 between {1, 10} → true', () => {
        const result = parser.parseExpression('1 between {1, 10}').getValue();
        expect(result).toBe(true);
      });
    });

    describe('instanceof', () => {
      it("'hello' instanceof 'string' → true", () => {
        expect(parser.parseExpression("'hello' instanceof 'string'").getValue()).toBe(true);
      });

      it("42 instanceof 'number' → true", () => {
        expect(parser.parseExpression("42 instanceof 'number'").getValue()).toBe(true);
      });

      it("42 instanceof 'string' → false", () => {
        expect(parser.parseExpression("42 instanceof 'string'").getValue()).toBe(false);
      });
    });
  });

  // ==================== COLLECTIONS ====================
  describe('inline collections', () => {
    describe('inline list', () => {
      it('{1, 2, 3} → [1, 2, 3]', () => {
        const result = parser.parseExpression('{1, 2, 3}').getValue();
        expect(result).toEqual([1, 2, 3]);
      });

      it('empty list {} → []', () => {
        const result = parser.parseExpression('{}').getValue();
        expect(result).toEqual([]);
      });

      it('mixed types', () => {
        const result = parser.parseExpression('{1, "two", 3.0}').getValue();
        expect(result).toEqual([1, 'two', 3.0]);
      });
    });

    describe('inline map', () => {
      it("{'key': 'value'} → Map", () => {
        const result = parser.parseExpression("{'key': 'value'}").getValue() as Map<string, unknown>;
        expect(result instanceof Map).toBe(true);
        expect(result.get('key')).toBe('value');
      });

      it('multiple entries', () => {
        const result = parser.parseExpression("{'a': 1, 'b': 2}").getValue() as Map<string, unknown>;
        expect(result.get('a')).toBe(1);
        expect(result.get('b')).toBe(2);
      });
    });

    describe('selection (.?[])', () => {
      it('.?[filter] — filter matches starting with "a"', () => {
        // Selection uses #this to refer to current element
        const result = parser.parseExpression("{'a', 'ab', 'abc', 'b'}.?[#this matches '^a.*$']")
          .getValue();
        expect(result).toEqual(['a', 'ab', 'abc']);
      });
    });
  });

  // ==================== VARIABLES AND PROPERTIES ====================
  describe('variables and properties', () => {
    it('access property of root object', () => {
      const ctx = new StandardEvaluationContext({ x: 100, y: 200 });
      const result = parser.parseExpression('x + y').getValueWithContext(ctx);
      expect(result).toBe(300);
    });

    it('nested property math', () => {
      const ctx = new StandardEvaluationContext({
        order: { quantity: 5, price: 20 },
      });
      const result = parser.parseExpression('order.quantity * order.price').getValueWithContext(ctx);
      expect(result).toBe(100);
    });

    it('#var comparison', () => {
      const ctx = new StandardEvaluationContext();
      ctx.setVariable('age', 25);
      expect(parser.parseExpression('#age > 18').getValueWithContext(ctx)).toBe(true);
    });

    it('#var in math', () => {
      const ctx = new StandardEvaluationContext();
      ctx.setVariable('x', 10);
      ctx.setVariable('y', 20);
      expect(parser.parseExpression('#x + #y').getValueWithContext(ctx)).toBe(30);
    });
  });

  // ==================== CONDITIONAL LOGIC ====================
  describe('conditional logic with operators', () => {
    it('compound condition', () => {
      const ctx = new StandardEvaluationContext();
      ctx.setVariable('score', 85);
      const result = parser.parseExpression('#score >= 60 && #score < 90')
        .getValueWithContext(ctx);
      expect(result).toBe(true);
    });

    it('ternary with variables', () => {
      const ctx = new StandardEvaluationContext();
      ctx.setVariable('passed', true);
      const result = parser.parseExpression("#passed ? 'PASS' : 'FAIL'")
        .getValueWithContext(ctx);
      expect(result).toBe('PASS');
    });

    it('nested conditions', () => {
      const ctx = new StandardEvaluationContext();
      ctx.setVariable('x', 15);
      const result = parser.parseExpression('#x > 10 && #x < 20 || #x > 100')
        .getValueWithContext(ctx);
      expect(result).toBe(true);
    });
  });

  // ==================== EDGE CASES ====================
  describe('edge cases', () => {
    it('null in arithmetic', () => {
      expect(parser.parseExpression('null + 5').getValue()).toBe(5);
    });

    it('boolean as number in comparison', () => {
      // true coerced to 1: 1 == 1 → true
      expect(parser.parseExpression('true == 1').getValue()).toBe(true);
    });

    it('0 is falsy', () => {
      expect(parser.parseExpression('0 ? 1 : 2').getValue()).toBe(2);
    });

    it('empty string is falsy (in ?:)', () => {
      // In SpEL, empty string is falsy for boolean context
      expect(parser.parseExpression("'' ? 1 : 2").getValue()).toBe(2);
    });

    it('non-empty string is truthy', () => {
      expect(parser.parseExpression("'hello' ? 1 : 2").getValue()).toBe(1);
    });
  });
});
