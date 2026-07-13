import { describe, it, expect } from 'vitest';
import {
  SpelExpressionParser,
  StandardEvaluationContext,
  StandardTypeLocator,
} from '../src/index.js';

describe('Phase 4b: Quick Coverage Fill', () => {
  const parser = new SpelExpressionParser();

  it('constructor reference via new expression', () => {
    const ctx = new StandardEvaluationContext();
    const typeLocator = new StandardTypeLocator();
    class Point {
      readonly x: number;
      readonly y: number;
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
      }
    }
    typeLocator.register('Point', Point);
    ctx.setTypeLocator(typeLocator);

    const result = parser.parseExpression('new Point(3, 4)').getValueWithContext(ctx);
    expect(result).toBeDefined();
  });

  it('indexer on array', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('arr', [1, 2, 3]);
    expect(parser.parseExpression('#arr[0]').getValueWithContext(ctx)).toBe(1);
    expect(parser.parseExpression('#arr[2]').getValueWithContext(ctx)).toBe(3);
  });

  it('indexer on map with string key', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable(
      'm',
      new Map([
        ['a', 1],
        ['b', 2],
      ]),
    );
    expect(parser.parseExpression("#m['a']").getValueWithContext(ctx)).toBe(1);
  });

  it('indexer on object with string key', () => {
    const ctx = new StandardEvaluationContext({ user: { name: 'Alice', age: 30 } });
    const result = parser.parseExpression("user['name']").getValueWithContext(ctx);
    expect(result).toBe('Alice');
  });

  it('indexer setValue via assignment', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('arr', [10, 20, 30]);
    parser.parseExpression('#arr[1] = 99').getValueWithContext(ctx);
    const arr = ctx.lookupVariable('arr')!.getValue() as number[];
    expect(arr[1]).toBe(99);
  });

  it('string method via compound expression', () => {
    const ctx = new StandardEvaluationContext({ text: 'hello' });
    const result = parser.parseExpression('text.toUpperCase()').getValueWithContext(ctx);
    expect(result).toBe('HELLO');
  });

  it('variable math expression', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('x', 5);
    ctx.setVariable('y', 3);
    expect(parser.parseExpression('#x + #y').getValueWithContext(ctx)).toBe(8);
  });

  it('compound expression with multiple levels', () => {
    const ctx = new StandardEvaluationContext({
      level1: { level2: { level3: { value: 'deep' } } },
    });
    expect(parser.parseExpression('level1.level2.level3.value').getValueWithContext(ctx)).toBe(
      'deep',
    );
  });

  it('type locator static method call', () => {
    const ctx = new StandardEvaluationContext();
    const typeLocator = new StandardTypeLocator();
    class MathUtils {
      static abs(x: number): number {
        return Math.abs(x);
      }
    }
    typeLocator.register('MathUtils', MathUtils, { abs: MathUtils.abs });
    ctx.setTypeLocator(typeLocator);

    const typeDesc = parser.parseExpression('T(MathUtils)').getValueWithContext(ctx) as {
      callStaticMethod(name: string, ...args: unknown[]): unknown;
    };
    expect(typeDesc.callStaticMethod('abs', -42)).toBe(42);
  });

  it('type locator static field', () => {
    const ctx = new StandardEvaluationContext();
    const typeLocator = new StandardTypeLocator();
    class Constants {}
    typeLocator.register('Constants', Constants, {}, { PI: 3.14 });
    ctx.setTypeLocator(typeLocator);

    const typeDesc = parser.parseExpression('T(Constants)').getValueWithContext(ctx) as {
      getStaticField(name: string): unknown;
    };
    expect(typeDesc.getStaticField('PI')).toBe(3.14);
  });
});
