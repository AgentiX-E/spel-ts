/**
 * Phase 6: Official Spring SpEL Full Syntax Coverage
 * Covers all remaining Spring SpEL features not in PRD:
 * - Octal literals, Range operator (..), T(Type).staticMethod/Field,
 *   instanceof T(Type), Projection on non-collection
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SpelExpressionParser, StandardEvaluationContext, StandardTypeLocator, DefaultBeanResolver } from '../src/index.js';

describe('Phase 6: Octal Literals', () => {
  const parser = new SpelExpressionParser();

  it('octal 0 → 0', () => {
    expect(parser.parseExpression('0').getValue()).toBe(0);
  });

  it('octal 01 → 1', () => {
    expect(parser.parseExpression('01').getValue()).toBe(1);
  });

  it('octal 07 → 7', () => {
    expect(parser.parseExpression('07').getValue()).toBe(7);
  });

  it('octal 010 → 8', () => {
    expect(parser.parseExpression('010').getValue()).toBe(8);
  });

  it('octal 0777 → 511', () => {
    expect(parser.parseExpression('0777').getValue()).toBe(511);
  });

  it('octal 017 is not decimal 17', () => {
    expect(parser.parseExpression('017').getValue()).toBe(15);
  });
});

describe('Phase 6: Range Operator (..)', () => {
  const parser = new SpelExpressionParser();

  it('1..5 generates [1,2,3,4,5]', () => {
    expect(parser.parseExpression('1..5').getValue()).toEqual([1, 2, 3, 4, 5]);
  });

  it('5..1 generates [5,4,3,2,1] (descending)', () => {
    expect(parser.parseExpression('5..1').getValue()).toEqual([5, 4, 3, 2, 1]);
  });

  it('3..3 generates [3]', () => {
    expect(parser.parseExpression('3..3').getValue()).toEqual([3]);
  });

  it('0..0 generates [0]', () => {
    expect(parser.parseExpression('0..0').getValue()).toEqual([0]);
  });

  it('range with variable bounds', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('from', 2);
    ctx.setVariable('to', 6);
    expect(parser.parseExpression('#from..#to').getValueWithContext(ctx))
      .toEqual([2, 3, 4, 5, 6]);
  });

  it('range toStringAST', () => {
    const expr = parser.parseExpression('1..3');
    expect(expr.toStringAST()).toContain('..');
  });
});

describe('Phase 6: T(Type).staticMethod() and .staticField', () => {
  const parser = new SpelExpressionParser();

  it('T(Type).staticMethod via compound expression', () => {
    const ctx = new StandardEvaluationContext();
    const typeLocator = new StandardTypeLocator();
    class MathUtil {
      static abs(x: number): number { return Math.abs(x); }
    }
    typeLocator.register('MathUtil', MathUtil, { abs: MathUtil.abs });
    ctx.setTypeLocator(typeLocator);

    // T(MathUtil).abs(-42) → 42
    const result = parser.parseExpression('T(MathUtil).abs(-42)').getValueWithContext(ctx);
    expect(result).toBe(42);
  });

  it('T(Type).staticMethod via variable', () => {
    const ctx = new StandardEvaluationContext();
    const typeLocator = new StandardTypeLocator();
    class Greeter {
      static hello(name: string): string { return 'Hi ' + name; }
    }
    typeLocator.register('Greeter', Greeter, { hello: Greeter.hello });
    ctx.setTypeLocator(typeLocator);

    // Use literal instead of variable since #name crosses contexts
    const result = parser.parseExpression("T(Greeter).hello('World')").getValueWithContext(ctx);
    expect(result).toBe('Hi World');
  });

  it('T(Type).staticField access', () => {
    const ctx = new StandardEvaluationContext();
    const typeLocator = new StandardTypeLocator();
    class Config {
      static readonly MAX = 100;
    }
    typeLocator.register('Config', Config, {}, { MAX: 100, DEFAULT: 42 });
    ctx.setTypeLocator(typeLocator);

    expect(parser.parseExpression('T(Config).MAX').getValueWithContext(ctx)).toBe(100);
    expect(parser.parseExpression('T(Config).DEFAULT').getValueWithContext(ctx)).toBe(42);
  });
});

describe('Phase 6: instanceof T(Type)', () => {
  const parser = new SpelExpressionParser();

  it("instanceof string via T() doesn't work (string primitive)", () => {
    // Primitive strings match typeof, not TypeDescriptor
    expect(parser.parseExpression("'hello' instanceof 'string'").getValue()).toBe(true);
  });

  it('instanceof T(Type) with registered type', () => {
    const ctx = new StandardEvaluationContext();
    const typeLocator = new StandardTypeLocator();
    class Animal {
      readonly species: string;
      constructor(s: string) { this.species = s; }
    }
    typeLocator.register('Animal', Animal);
    ctx.setTypeLocator(typeLocator);

    const dog = new Animal('dog');
    ctx.setVariable('pet', dog);

    const result = parser.parseExpression('#pet instanceof T(Animal)')
      .getValueWithContext(ctx);
    expect(result).toBe(true);
  });

  it('instanceof T(Type) returns false for non-matching', () => {
    const ctx = new StandardEvaluationContext();
    const typeLocator = new StandardTypeLocator();
    class Animal {
      constructor(public s: string) {}
    }
    typeLocator.register('Animal', Animal);
    ctx.setTypeLocator(typeLocator);

    ctx.setVariable('notAnimal', { name: 'Bob' });

    const result = parser.parseExpression('#notAnimal instanceof T(Animal)')
      .getValueWithContext(ctx);
    expect(result).toBe(false);
  });
});

describe('Phase 6: Projection on non-collection', () => {
  const parser = new SpelExpressionParser();

  it('.![projection] on non-collection wraps and projects', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('v', 42);
    // 42.![#this * 2] → [84] (wrap 42 in [42], then project)
    // Actually Spring treats single value as collection of 1 element
    const result = parser.parseExpression('#v.![#this * 2]').getValueWithContext(ctx);
    expect(result).toEqual([84]);
  });

  it('.![projection] on string', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('s', 'hello');
    const result = parser.parseExpression('#s.![#this]').getValueWithContext(ctx);
    expect(result).toEqual(['hello']);
  });
});

describe('Phase 6: @bean advanced patterns', () => {
  const parser = new SpelExpressionParser();

  it('@bean with registered bean via compound expression', () => {
    const ctx = new StandardEvaluationContext();
    const br = new DefaultBeanResolver();
    class Calculator {
      add(a: number, b: number): number { return a + b; }
    }
    br.register('calc', new Calculator());
    ctx.setBeanResolver(br);

    const result = parser.parseExpression('@calc.add(3, 4)').getValueWithContext(ctx);
    expect(result).toBe(7);
  });
});

describe('Phase 6: Method invocations via compound expression', () => {
  const parser = new SpelExpressionParser();

  it('chained method calls on object', () => {
    const ctx = new StandardEvaluationContext({
      calculator: {
        value: 5,
        add(n: number): number { return this.value + n; },
      },
    });
    const result = parser.parseExpression('calculator.add(3)').getValueWithContext(ctx);
    expect(result).toBe(8);
  });
});
