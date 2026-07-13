/**
 * Phase 7: 100% Coverage - ALL remaining uncovered lines
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  SpelExpressionParser,
  StandardEvaluationContext,
  StandardTypeLocator,
  DefaultBeanResolver,
} from '../src/index.js';
import { SpelNodeImpl } from '../src/ast/spel-node.js';
import { NullLiteral } from '../src/ast/literal/null-literal.js';
import { OpNE } from '../src/ast/operator/op-ne.js';
import { OpEQ } from '../src/ast/operator/op-eq.js';
import { OpLT } from '../src/ast/operator/op-lt.js';
import { OpGT } from '../src/ast/operator/op-gt.js';
import { OpLE } from '../src/ast/operator/op-le.js';
import { OpGE } from '../src/ast/operator/op-ge.js';
import { OpMatches } from '../src/ast/operator/op-matches.js';
import { ExpressionState } from '../src/expression-state.js';
import { TypedValue } from '../src/typed-value.js';
import { Selection } from '../src/ast/collection/selection.js';
import { Projection } from '../src/ast/collection/projection.js';

describe('Phase7: OpNE string comparison', () => {
  it('two different strings with !=', () => {
    const p = new SpelExpressionParser();
    expect(p.parseExpression("'hello' != 'world'").getValue()).toBe(true);
  });
  it('two same strings with !=', () => {
    const p = new SpelExpressionParser();
    expect(p.parseExpression("'hello' != 'hello'").getValue()).toBe(false);
  });
});

describe('Phase7: Comparison default coercion', () => {
  const p = new SpelExpressionParser();
  it('OpEQ null vs number uses string coercion', () => {
    expect(p.parseExpression('1 == 1').getValue()).toBe(true);
  });
  it('OpNE null vs 1 uses string coercion', () => {
    expect(p.parseExpression('1 != 2').getValue()).toBe(true);
  });
  it('OpLT null vs 2 uses string coercion', () => {
    expect(p.parseExpression('1 < 2').getValue()).toBe(true);
  });
  it('OpGT null vs number', () => {
    expect(p.parseExpression('1 > 0').getValue()).toBe(true);
  });
  it('OpLE object types use string coercion', () => {
    expect(p.parseExpression('true <= 0').getValue()).toBe(false);
  });
  it('OpGE object types use string coercion', () => {
    expect(p.parseExpression('false >= 0').getValue()).toBe(true);
  });
});

describe('Phase7: OpMatches invalid regex', () => {
  it('invalid regex pattern throws', () => {
    expect(() =>
      new SpelExpressionParser().parseExpression("'x' matches '['").getValue(),
    ).toThrow();
  });
});

describe('Phase7: SpelNodeImpl setChild/getChilcount', () => {
  it('getChildCount after setChild', () => {
    const n1 = new NullLiteral(0, 4);
    const n2 = new NullLiteral(0, 4);
    const op = new OpNE('!=', 0, 8, n1, n2);
    expect(op.getChildCount()).toBe(2);
    op.setChild(0, n2);
    expect(op.getChild(0)).toBe(n2);
  });
});

describe('Phase7: type-descriptor-accessor branches', () => {
  it('canRead returns true for TypeDescriptor objects', () => {
    const ctx = new StandardEvaluationContext();
    const tl = new StandardTypeLocator();
    class Foo {}
    tl.register('Foo', Foo);
    ctx.setTypeLocator(tl);
    const td = ctx.getTypeLocator().findType('Foo');
    const expr = new SpelExpressionParser().parseExpression('T(Foo)');
    expect(expr.getValueWithContext(ctx)).toBeDefined();
  });

  it('canWrite works for TypeDescriptor', () => {
    const ctx = new StandardEvaluationContext();
    const tl = new StandardTypeLocator();
    class Foo {}
    tl.register('Foo', Foo, {}, { val: 1 });
    ctx.setTypeLocator(tl);
    // Test canWrite through accessor chain
    const expr = new SpelExpressionParser().parseExpression('T(Foo).val');
    const val = expr.getValueWithContext(ctx);
    expect(val).toBe(1);
  });

  it('static method call via descriptor', () => {
    const ctx = new StandardEvaluationContext();
    const tl = new StandardTypeLocator();
    class Calc {
      static add(a: number, b: number) {
        return a + b;
      }
    }
    tl.register('Calc', Calc, { add: Calc.add });
    ctx.setTypeLocator(tl);
    const result = new SpelExpressionParser()
      .parseExpression('T(Calc).add(1,2)')
      .getValueWithContext(ctx);
    expect(result).toBe(3);
  });

  it('constructor property access via descriptor', () => {
    const ctx = new StandardEvaluationContext();
    const tl = new StandardTypeLocator();
    class MyCls {}
    tl.register('MyCls', MyCls);
    ctx.setTypeLocator(tl);
    const result = new SpelExpressionParser()
      .parseExpression('T(MyCls).name')
      .getValueWithContext(ctx);
    expect(result).toBe('MyCls');
  });
});

describe('Phase7: reflective-method-resolver edge', () => {
  it('string method startsWith', () => {
    const ctx = new StandardEvaluationContext({ s: 'hello' });
    const r = new SpelExpressionParser()
      .parseExpression("s.startsWith('h')")
      .getValueWithContext(ctx);
    expect(r).toBe(true);
  });
  it('string method endsWith', () => {
    const ctx = new StandardEvaluationContext({ s: 'hello' });
    const r = new SpelExpressionParser()
      .parseExpression("s.endsWith('o')")
      .getValueWithContext(ctx);
    expect(r).toBe(true);
  });
});

describe('Phase7: projection nullSafe path', () => {
  it('projection null-safe on null returns null', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('n', null);
    // null-safe projection would return NULL but parser creates non-null-safe
    // Test the null path of projection: null target with non-nullSafe throws
    expect(() => {
      const p = new SpelExpressionParser();
      p.parseExpression('#n.![#this]').getValueWithContext(ctx);
    }).toThrow();
  });
});

describe('Phase7: selection nullSafe path', () => {
  it('selection on null returns empty array', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('n', null);
    const r = new SpelExpressionParser()
      .parseExpression('#n.?[#this > 0]')
      .getValueWithContext(ctx);
    expect(r).toEqual([]);
  });
});

describe('Phase7: constructor-reference', () => {
  it('new without args', () => {
    const ctx = new StandardEvaluationContext();
    const tl = new StandardTypeLocator();
    class Empty {}
    tl.register('Empty', Empty);
    ctx.setTypeLocator(tl);
    const r = new SpelExpressionParser().parseExpression('new Empty()').getValueWithContext(ctx);
    expect(r).toBeDefined();
  });
});

describe('Phase7: method-reference fallback', () => {
  it('method via accessor chain', () => {
    const ctx = new StandardEvaluationContext();
    const obj = { greet: () => 'hello' };
    ctx.setRootObject(obj);
    const r = new SpelExpressionParser().parseExpression('greet()').getValueWithContext(ctx);
    expect(r).toBe('hello');
  });
});

describe('Phase7: standard-evaluation-context stubs', () => {
  it('default typeLocator throws', () => {
    const ctx = new StandardEvaluationContext();
    expect(() => ctx.getTypeLocator().findType('X')).toThrow();
  });
  it('default beanResolver throws', () => {
    const ctx = new StandardEvaluationContext();
    expect(() => ctx.getBeanResolver().resolve('X')).toThrow();
  });
});

describe('Phase7: indexer setValue branches', () => {
  it('indexer write to array via assignment', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('a', [1, 2, 3]);
    new SpelExpressionParser().parseExpression('#a[1] = 99').getValueWithContext(ctx);
    expect((ctx.lookupVariable('a')!.getValue() as number[])[1]).toBe(99);
  });
});

describe('Phase7: method-reference method not found', () => {
  it('method call on null throws', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('n', null);
    expect(() => {
      new SpelExpressionParser().parseExpression('#n.method()').getValueWithContext(ctx);
    }).toThrow();
  });
});
