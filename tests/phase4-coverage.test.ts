/**
 * Phase 4: Coverage completion — 验证所有审计发现修复 + 覆盖率提升至 95%+
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  SpelExpressionParser,
  StandardEvaluationContext,
  DefaultBeanResolver,
  StandardTypeLocator,
  SpelMessage,
} from '../src/index.js';

describe('Phase 4: Bean References (@bean / &@factoryBean)', () => {
  const parser = new SpelExpressionParser();

  it('COV-1: @bean resolves via BeanResolver', () => {
    const ctx = new StandardEvaluationContext();
    const beanResolver = new DefaultBeanResolver();
    beanResolver.register('myBean', 'beanValue');
    ctx.setBeanResolver(beanResolver);

    const result = parser.parseExpression('@myBean').getValueWithContext(ctx);
    expect(result).toBe('beanValue');
  });

  it('COV-2: @nonExistentBean throws BEAN_NOT_FOUND', () => {
    const ctx = new StandardEvaluationContext();
    const beanResolver = new DefaultBeanResolver();
    ctx.setBeanResolver(beanResolver);

    expect(() => parser.parseExpression('@missing').getValueWithContext(ctx)).toThrow();
  });

  it('COV-3: &@factoryBean resolves via factory', () => {
    const ctx = new StandardEvaluationContext();
    const beanResolver = new DefaultBeanResolver();
    beanResolver.registerFactory('myFactory', () => 'factoryResult');
    ctx.setBeanResolver(beanResolver);

    // 目前 &@ 前缀在 tokenizer 中，但 parser 将其识别为 AT
    // BeanReference 的 isFactoryBean 标志由 eatBeanReference 中从 atToken.kind === AMP_AT 设置
    // 由于 tokenizer 将 &@ 两个字符合并为 AMP_AT，parser 的 case AMP_AT 会触发 eatBeanReference
    // eatBeanReference 检测 atToken.kind === AMP_AT 并设置 isFactoryBean = true
    const result = parser.parseExpression('&@myFactory').getValueWithContext(ctx);
    expect(result).toBe('factoryResult');
  });

  it('COV-4: @bean.method(args) calls method on resolved bean', () => {
    const ctx = new StandardEvaluationContext();
    const beanResolver = new DefaultBeanResolver();
    beanResolver.register('app', { getName: () => 'MyApp' });
    ctx.setBeanResolver(beanResolver);

    const result = parser.parseExpression('@app.getName()').getValueWithContext(ctx);
    expect(result).toBe('MyApp');
  });

  it('COV-5: @bean.property accesses property', () => {
    const ctx = new StandardEvaluationContext();
    const beanResolver = new DefaultBeanResolver();
    beanResolver.register('config', { version: '2.0.0' });
    ctx.setBeanResolver(beanResolver);

    const result = parser.parseExpression('@config.version').getValueWithContext(ctx);
    expect(result).toBe('2.0.0');
  });
});

describe('Phase 4: #root Variable', () => {
  const parser = new SpelExpressionParser();

  it('COV-6: #root returns root object', () => {
    const ctx = new StandardEvaluationContext({ name: 'rootValue' });
    const result = parser.parseExpression('#root.name').getValueWithContext(ctx);
    expect(result).toBe('rootValue');
  });

  it('COV-7: #root refers to root even with scoped variables', () => {
    const ctx = new StandardEvaluationContext({ name: 'rootScope' });
    ctx.setVariable('name', 'localScope');

    const result = parser.parseExpression('#root.name').getValueWithContext(ctx);
    expect(result).toBe('rootScope');
  });
});

describe('Phase 4: T(Type) Type Reference', () => {
  const parser = new SpelExpressionParser();

  it('COV-8: T() resolves registered type', () => {
    const ctx = new StandardEvaluationContext();
    const typeLocator = new StandardTypeLocator();
    class MyType {
      static calc(x: number): number { return x * 2; }
    }
    typeLocator.register('MyType', MyType, { calc: MyType.calc });
    ctx.setTypeLocator(typeLocator);

    const result = parser.parseExpression('T(MyType)').getValueWithContext(ctx);
    expect(result).toBeDefined();
  });

  it('COV-9: TypeDescriptor isInstance works', () => {
    const ctx = new StandardEvaluationContext();
    const typeLocator = new StandardTypeLocator();
    class MyType {
      constructor(public readonly value: number) {}
    }
    typeLocator.register('MyType', MyType);
    ctx.setTypeLocator(typeLocator);

    const result = parser.parseExpression('T(MyType)').getValueWithContext(ctx);
    const typeDesc = result as { isInstance(v: unknown): boolean; };
    const instance = new MyType(42);
    expect(typeDesc.isInstance(instance)).toBe(true);
    expect(typeDesc.isInstance('notMyType')).toBe(false);
  });

  it('COV-10: TypeDescriptor newInstance works', () => {
    const ctx = new StandardEvaluationContext();
    const typeLocator = new StandardTypeLocator();
    class Person {
      readonly name: string;
      constructor(name: string) { this.name = name; }
    }
    typeLocator.register('Person', Person);
    ctx.setTypeLocator(typeLocator);

    const typeDesc = parser.parseExpression('T(Person)').getValueWithContext(ctx) as {
      newInstance(...args: unknown[]): unknown;
    };
    const instance = typeDesc.newInstance('Alice') as Person;
    expect(instance.name).toBe('Alice');
  });

  it('COV-11: TypeDescriptor callStaticMethod works', () => {
    const ctx = new StandardEvaluationContext();
    const typeLocator = new StandardTypeLocator();
    class Utils {
      static double(x: number): number { return x * 2; }
    }
    typeLocator.register('Utils', Utils, { double: Utils.double });
    ctx.setTypeLocator(typeLocator);

    const typeDesc = parser.parseExpression('T(Utils)').getValueWithContext(ctx) as {
      callStaticMethod(name: string, ...args: unknown[]): unknown;
    };
    expect(typeDesc.callStaticMethod('double', 21)).toBe(42);
  });
});

describe('Phase 4: instanceof Enhanced', () => {
  const parser = new SpelExpressionParser();

  it('COV-12: instanceof typeof string returns true', () => {
    expect(parser.parseExpression("'hello' instanceof 'string'").getValue()).toBe(true);
  });

  it('COV-13: instanceof typeof number returns true', () => {
    expect(parser.parseExpression('42 instanceof "number"').getValue()).toBe(true);
  });

  it('COV-14: instanceof typeof boolean returns true', () => {
    expect(parser.parseExpression('true instanceof "boolean"').getValue()).toBe(true);
  });

  it('COV-15: instanceof typeof object returns true for objects', () => {
    const ctx = new StandardEvaluationContext({ obj: {} });
    const result = parser.parseExpression('#root.obj instanceof "object"').getValueWithContext(ctx);
    expect(result).toBe(true);
  });

  it('COV-16: instanceof typeof null returns false', () => {
    expect(parser.parseExpression('null instanceof "string"').getValue()).toBe(false);
  });
});

describe('Phase 4: Selection Semantics (.^[ .$[ .*[)', () => {
  const parser = new SpelExpressionParser();

  it('COV-17: .^[ returns first matching element', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('list', [1, 2, 3, 4, 5]);
    const result = parser.parseExpression('#list.^[#this > 2]').getValueWithContext(ctx);
    expect(result).toBe(3);
  });

  it('COV-18: .^[ returns null when no match', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('list', [1, 2, 3]);
    const result = parser.parseExpression('#list.^[#this > 10]').getValueWithContext(ctx);
    expect(result).toBeNull();
  });

  it('COV-19: .*[ returns last matching element', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('list', [1, 2, 3, 4, 5]);
    const result = parser.parseExpression('#list.*[#this > 2]').getValueWithContext(ctx);
    expect(result).toBe(5);
  });

  it('COV-20: .*[ returns null when no match', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('list', [1, 2, 3]);
    const result = parser.parseExpression('#list.*[#this > 10]').getValueWithContext(ctx);
    expect(result).toBeNull();
  });

  it('COV-21: .?[ returns all matching', () => {
    const result = parser.parseExpression('{1, 2, 3, 4, 5}.?[ #this > 2 ]').getValue();
    expect(result).toEqual([3, 4, 5]);
  });
});

describe('Phase 4: Unterminated String Error', () => {
  it('COV-22: unterminated single-quoted string throws', () => {
    const parser = new SpelExpressionParser();
    expect(() => parser.parseExpression("'hello")).toThrow();
  });

  it('COV-23: unterminated double-quoted string throws', () => {
    const parser = new SpelExpressionParser();
    expect(() => parser.parseExpression('"hello')).toThrow();
  });

  it('COV-24: empty string with proper quotes is valid', () => {
    const parser = new SpelExpressionParser();
    expect(parser.parseExpression("''").getValue()).toBe('');
  });
});

describe('Phase 4: Edge Case Coverage', () => {
  const parser = new SpelExpressionParser();

  it('COV-25: hex literal 0xFF = 255', () => {
    expect(parser.parseExpression('0xFF').getValue()).toBe(255);
  });

  it('COV-26: hex literal with 0X prefix', () => {
    expect(parser.parseExpression('0XAB').getValue()).toBe(171);
  });

  it('COV-27: negative hex evaluates as unary minus on hex', () => {
    // -0x1 is parsed as -(0x1) = -(1) = -1 (valid)
    expect(parser.parseExpression('-0x1').getValue()).toBe(-1);
  });

  it('COV-28: method call without args', () => {
    const ctx = new StandardEvaluationContext({ func: () => 42 });
    const result = parser.parseExpression('func()').getValueWithContext(ctx);
    expect(result).toBe(42);
  });

  it('COV-29: string comparison with localeCompare semantics', () => {
    expect(parser.parseExpression("'a' < 'b'").getValue()).toBe(true);
  });

  it('COV-30: complex precedence chain', () => {
    const result = parser.parseExpression('2 + 3 * 4 - 10 / 2 > 0 && 1 < 2').getValue();
    expect(result).toBe(true);
  });

  it('COV-31: assignment in context', () => {
    const ctx = new StandardEvaluationContext({ x: 5 });
    parser.parseExpression('x = 10').getValueWithContext(ctx);
    expect(ctx.getRootObject().getValue()).toEqual({ x: 10 });
  });

  it('COV-32: nested inline collections', () => {
    const result = parser.parseExpression('{{1, 2}, {3, 4}}').getValue();
    expect(result).toEqual([[1, 2], [3, 4]]);
  });

  it('COV-33: string with embedded expression', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('name', 'Alice');
    const result = parser.parseExpression("'Hello, ' + #name + '!'").getValueWithContext(ctx);
    expect(result).toBe('Hello, Alice!');
  });
});

describe('Phase 4: Error Message Coverage', () => {
  it('COV-34: INDEX_OUT_OF_BOUNDS via indexer', () => {
    const parser = new SpelExpressionParser();
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('arr', [1, 2, 3]);
    expect(() => parser.parseExpression('#arr[5]').getValueWithContext(ctx)).toThrow();
  });

  it('COV-35: PROPERTY_OR_FIELD_NOT_READABLE_ON_NULL', () => {
    const parser = new SpelExpressionParser();
    const ctx = new StandardEvaluationContext({ user: null });
    expect(() => parser.parseExpression('user.name').getValueWithContext(ctx)).toThrow();
  });

  it('COV-36: FUNCTION_NOT_FOUND', () => {
    const parser = new SpelExpressionParser();
    expect(() => parser.parseExpression('#nonexistentFunc()').getValue()).toThrow();
  });
});
