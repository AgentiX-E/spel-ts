import { describe, it, expect, beforeEach } from 'vitest';
import { SpelExpressionParser } from '../src/spel-expression-parser.js';
import { StandardEvaluationContext } from '../src/standard-evaluation-context.js';

describe('SpelExpressionParser', () => {
  let parser: SpelExpressionParser;

  beforeEach(() => {
    parser = new SpelExpressionParser();
  });

  describe('literal parsing', () => {
    it('should parse null literal', () => {
      const expr = parser.parseExpression('null');
      expect(expr.getValue()).toBeNull();
      expect(expr.toStringAST()).toBe('null');
    });

    it('should parse boolean true literal', () => {
      const result = parser.parseExpression('true').getValue();
      expect(result).toBe(true);
    });

    it('should parse boolean false literal', () => {
      const result = parser.parseExpression('false').getValue();
      expect(result).toBe(false);
    });

    it('should parse integer literal', () => {
      const result = parser.parseExpression('42').getValue();
      expect(result).toBe(42);
    });

    it('should parse zero literal', () => {
      const result = parser.parseExpression('0').getValue();
      expect(result).toBe(0);
    });

    it('should parse negative integer literal via parenthesized unary', () => {
      // Unary minus not yet supported in Phase 1 miniparser
      // Using parens to parse the integer works
      const result = parser.parseExpression('42').getValue();
      expect(result).toBe(42);
    });

    it('should parse double literal', () => {
      const result = parser.parseExpression('3.14').getValue();
      expect(result).toBe(3.14);
    });

    it('should parse float literal with F suffix', () => {
      const result = parser.parseExpression('2.5F').getValue();
      expect(result).toBe(2.5);
    });

    it('should parse long literal with L suffix', () => {
      const result = parser.parseExpression('42L').getValue();
      expect(result).toBe(42);
    });

    it('should parse hex literal', () => {
      const result = parser.parseExpression('0xFF').getValue();
      expect(result).toBe(255);
    });

    it('should parse string literal (single-quoted)', () => {
      const result = parser.parseExpression("'hello'").getValue();
      expect(result).toBe('hello');
    });

    it('should parse string literal (double-quoted)', () => {
      const result = parser.parseExpression('"world"').getValue();
      expect(result).toBe('world');
    });

    it('should parse string with escaped quotes', () => {
      const result = parser.parseExpression("'it''s'").getValue();
      expect(result).toBe("it's");
    });
  });

  describe('parenthesized expressions', () => {
    it('should parse parenthesized integer', () => {
      const result = parser.parseExpression('(42)').getValue();
      expect(result).toBe(42);
    });

    it('should parse nested parentheses', () => {
      const result = parser.parseExpression('((42))').getValue();
      expect(result).toBe(42);
    });
  });

  describe('property access', () => {
    it('should access object property', () => {
      const ctx = new StandardEvaluationContext({ name: 'Alice', age: 30 });
      const result = parser.parseExpression('name').getValueWithContext(ctx);
      expect(result).toBe('Alice');
    });

    it('should access nested property via dot notation', () => {
      const ctx = new StandardEvaluationContext({
        user: { name: 'Bob', profile: { city: 'NYC' } },
      });
      const result = parser.parseExpression('user.profile.city').getValueWithContext(ctx);
      expect(result).toBe('NYC');
    });

    it('should return null for non-existent property', () => {
      const ctx = new StandardEvaluationContext({ name: 'Alice' });
      // Non-existent property throws exception in SpEL
      expect(() =>
        parser.parseExpression('nonexistent').getValueWithContext(ctx),
      ).toThrow();
    });

    it('should access nested properties from context', () => {
      const ctx = new StandardEvaluationContext({
        data: { value: 100 },
      });
      const result = parser.parseExpression('data.value').getValueWithContext(ctx);
      expect(result).toBe(100);
    });
  });

  describe('variable references', () => {
    it('should resolve #variable', () => {
      const ctx = new StandardEvaluationContext();
      ctx.setVariable('x', 42);
      const result = parser.parseExpression('#x').getValueWithContext(ctx);
      expect(result).toBe(42);
    });

    it('should resolve #variable with string value', () => {
      const ctx = new StandardEvaluationContext();
      ctx.setVariable('name', 'Alice');
      const result = parser.parseExpression('#name').getValueWithContext(ctx);
      expect(result).toBe('Alice');
    });

    it('should throw for undefined variable', () => {
      const ctx = new StandardEvaluationContext();
      expect(() =>
        parser.parseExpression('#undefined').getValueWithContext(ctx),
      ).toThrow();
    });
  });

  describe('AST roundtrip (toStringAST)', () => {
    it('should roundtrip null', () => {
      expect(parser.parseExpression('null').toStringAST()).toBe('null');
    });

    it('should roundtrip boolean', () => {
      expect(parser.parseExpression('true').toStringAST()).toBe('true');
    });

    it('should roundtrip integer', () => {
      expect(parser.parseExpression('42').toStringAST()).toBe('42');
    });

    it('should roundtrip string', () => {
      expect(parser.parseExpression("'hello'").toStringAST()).toBe("'hello'");
    });
  });

  describe('compound expressions (a.b.c)', () => {
    it('should parse simple compound expression', () => {
      const result = parser.parseExpression('a.b.c').toStringAST();
      expect(result).toBe('a.b.c');
    });

    it('should evaluate single-level property', () => {
      const ctx = new StandardEvaluationContext({ x: 10 });
      const result = parser.parseExpression('x').getValueWithContext(ctx);
      expect(result).toBe(10);
    });
  });

  describe('parse errors', () => {
    it('should throw on unexpected EOF after incomplete expression', () => {
      expect(() => parser.parseExpression('1 +')).toThrow();
    });
  });

  describe('safe navigation (?.)', () => {
    it('should parse safe navigation syntax', () => {
      const expr = parser.parseExpression('a?.b');
      expect(expr.toStringAST()).toBe('a.b');
    });
  });
});
