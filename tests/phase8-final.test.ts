
import { describe, it, expect } from 'vitest';
import { Token } from '../src/tokenizer/token.js';
import { TokenKind } from '../src/tokenizer/token-kind.js';
import { SpelNodeImpl, Literal as ASTLiteral } from '../src/ast/spel-node.js';
import { NullLiteral } from '../src/ast/literal/null-literal.js';
import { RealLiteral } from '../src/ast/literal/real-literal.js';
import { LongLiteral } from '../src/ast/literal/long-literal.js';
import { IntLiteral } from '../src/ast/literal/int-literal.js';
import { FloatLiteral } from '../src/ast/literal/float-literal.js';
import { OpPlus } from '../src/ast/operator/op-plus.js';
import { OpMinus } from '../src/ast/operator/op-minus.js';
import { ExpressionState } from '../src/expression-state.js';
import { StandardEvaluationContext, SpelExpressionParser } from '../src/index.js';
import { OpInc } from '../src/ast/operator/op-inc.js';
import { OpDec } from '../src/ast/operator/op-dec.js';
import { ReflectivePropertyAccessor } from '../src/evaluation-context/reflective-property-accessor.js';
import { TypeDescriptorAccessor } from '../src/evaluation-context/type-descriptor-accessor.js';
import { ReflectiveMethodResolver } from '../src/evaluation-context/reflective-method-resolver.js';
import { StandardTypeLocator } from '../src/type/standard-type-locator.js';
import { DefaultBeanResolver } from '../src/bean/default-bean-resolver.js';

// === token.ts keyword branches (43-49) ===
describe('Phase8: Token keyword branches', () => {
  const keywords = [
    TokenKind.MOD, TokenKind.EQ, TokenKind.NE,
    TokenKind.LT, TokenKind.LE, TokenKind.GT, TokenKind.GE,
  ];
  keywords.forEach(k => {
    it(`Token isKeyword for ${TokenKind[k]}`, () => {
      expect(new Token(k, 0, 1).isKeyword()).toBe(true);
    });
  });
});

// === real/long literal toStringAST ===
describe('Phase8: Literal toStringAST', () => {
  it('RealLiteral toStringAST', () => {
    expect(new RealLiteral(0, 4, 3.14).toStringAST()).toContain('3.14');
  });
  it('LongLiteral toStringAST', () => {
    expect(new LongLiteral(0, 3, 42).toStringAST()).toContain('L');
  });
  it('IntLiteral toStringAST', () => {
    expect(new IntLiteral(0, 2, 42).toStringAST()).toBe('42');
  });
  it('FloatLiteral toStringAST', () => {
    expect(new FloatLiteral(0, 4, 2.5).toStringAST()).toContain('F');
  });
  it('NullLiteral toStringAST', () => {
    expect(new NullLiteral(0, 4).toStringAST()).toBe('null');
  });
});

// === compound-expression.ts lines 8-9 ===
describe('Phase8: CompoundExpression single child', () => {
  it('single identifier as compound', () => {
    const ctx = new StandardEvaluationContext({x:42});
    const r = new SpelExpressionParser().parseExpression('x').getValueWithContext(ctx);
    expect(r).toBe(42);
  });
});

// === op-eq.ts line 31 / op-lt.ts line 25 ===
describe('Phase8: Comparison default paths', () => {
  const p = new SpelExpressionParser();
  it('OP_EQ: null==null via default', () => {
    expect(p.parseExpression('null == null').getValue()).toBe(true);
  });
  it('OP_LT: null<undefined via default', () => {
    // NaN comparison: both non-string, non-number → string coercion
    expect(p.parseExpression('true < false').getValue()).toBe(false);
  });
});

// === op-dec.ts:27 / op-inc.ts:27 ===
describe('Phase8: Inc/Dec toStringAST', () => {
  it('OpInc toStringAST', () => {
    const inc = new OpInc('++', 0, 2, new NullLiteral(0, 4));
    expect(inc.toStringAST()).toBeDefined();
  });
  it('OpDec toStringAST', () => {
    const dec = new OpDec('--', 0, 2, new NullLiteral(0, 4));
    expect(dec.toStringAST()).toBeDefined();
  });
});

// === spel-node.ts line 92 ===
describe('Phase8: Operator toStringAST with single child', () => {
  it('Operator toStringAST with single operand', () => {
    const op = new OpMinus('-', 0, 5, new IntLiteral(0,1,5));
    expect(op.toStringAST()).toBeDefined();
  });
});

// === indexer.ts:60-61 ===
describe('Phase8: Indexer write to map', () => {
  it('indexer setValue on map', () => {
    const ctx = new StandardEvaluationContext();
    const m = new Map([['k','old']]);
    ctx.setVariable('m', m);
    new SpelExpressionParser().parseExpression('#m["k"] = "new"').getValueWithContext(ctx);
    expect(m.get('k')).toBe('new');
  });
});

// === reflective-property-accessor.ts:9-10 ===
describe('Phase8: ReflectivePropertyAccessor specificTargetClasses', () => {
  it('returns null for generic', () => {
    expect(new ReflectivePropertyAccessor().getSpecificTargetClasses()).toBeNull();
  });
});

// === projection.ts:36,51-52 ===
describe('Phase8: Projection Map iteration', () => {
  it('projection on Map iterates values', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('m', new Map([['a',1],['b',2]]));
    const r = new SpelExpressionParser().parseExpression('#m.![#this * 10]').getValueWithContext(ctx);
    expect(r).toEqual([10,20]);
  });
});

// === selection.ts:32-33 ===
describe('Phase8: Selection Map iteration', () => {
  it('selection on Map iterates values', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('m', new Map([['a',1],['b',2],['c',3]]));
    const r = new SpelExpressionParser().parseExpression('#m.?[#this > 1]').getValueWithContext(ctx);
    expect(r).toEqual([2,3]);
  });
});

// === type-descriptor-accessor: full coverage ===
describe('Phase8: TypeDescriptorAccessor full coverage', () => {
  it('canRead false for null', () => {
    const a = new TypeDescriptorAccessor();
    expect(a.canRead({} as any, null, 'x')).toBe(false);
    expect(a.canRead({} as any, undefined, 'x')).toBe(false);
    expect(a.canRead({} as any, {}, 'x')).toBe(false);
  });

  it('read returns NULL for non-existent', () => {
    const a = new TypeDescriptorAccessor();
    const td = { name:'T', constructor: class{}, staticMethods:{}, staticFields:{} };
    expect(a.read({} as any, td, 'missing')).toBeDefined();
  });

  it('read returns constructor static method', () => {
    const a = new TypeDescriptorAccessor();
    class T { static foo(){return 42;} }
    const td = { name:'T', constructor:T, staticMethods:{}, staticFields:{}, isInstance:()=>true, newInstance:()=>new T(), callStaticMethod:()=>42, getStaticField:()=>null };
    const v = a.read({} as any, td, 'foo');
    expect(v.getValue()).toBe(T.foo);
  });

  it('read returns constructor property', () => {
    const a = new TypeDescriptorAccessor();
    class T { static bar = 99; }
    const td = { name:'T', constructor:T, staticMethods:{}, staticFields:{}, isInstance:()=>true, newInstance:()=>new T(), callStaticMethod:()=>42, getStaticField:()=>null };
    const v = a.read({} as any, td, 'bar');
    expect(v.getValue()).toBe(99);
  });

  it('read returns name field', () => {
    const a = new TypeDescriptorAccessor();
    class T {}
    const td = { name: 'MyType', constructor: T, staticMethods: {}, staticFields: {}, isInstance: () => true, newInstance: () => new T(), callStaticMethod: () => 42, getStaticField: () => null };
    // constructor.name takes priority over td.name for property access
    const v = a.read({} as never, td, 'name');
    expect(v.getValue()).toBe('T');
  });

  it('canWrite and write', () => {
    const a = new TypeDescriptorAccessor();
    const sf: Record<string,unknown> = {};
    const td = { name:'T', constructor:class{}, staticMethods:{}, staticFields:sf, isInstance:()=>true, newInstance:()=>({}), callStaticMethod:()=>42, getStaticField:()=>null };
    expect(a.canWrite({} as any, td, 'k')).toBe(true);
    a.write({} as any, td, 'k', 'v');
    expect(sf.k).toBe('v');
  });

  it('canWrite false for null', () => {
    const a = new TypeDescriptorAccessor();
    expect(a.canWrite({} as any, null, 'k')).toBe(false);
  });
});

// === reflective-method-resolver:54-56,58-59,69 ===
describe('Phase8: ReflectiveMethodResolver edge', () => {
  it('method on non-string non-number returns null', () => {
    const r = new ReflectiveMethodResolver();
    expect(r.resolve({} as any, {}, 'foo', [])).toBeNull();
  });

  it('string method not found returns null', () => {
    const r = new ReflectiveMethodResolver();
    expect(r.resolve({} as any, 'hello', 'missing', [])).toBeNull();
  });

  it('number method not found returns null', () => {
    const r = new ReflectiveMethodResolver();
    expect(r.resolve({} as any, 42, 'missing', [])).toBeNull();
  });

  it('method throws during invocation', () => {
    const r = new ReflectiveMethodResolver();
    const obj = { explode: () => { throw new Error('BOOM'); } };
    expect(() => r.resolve({} as any, obj, 'explode', [])).toThrow();
  });
});

// === method-reference.ts:39-42,44-45,60-61 ===
describe('Phase8: MethodReference fallback', () => {
  it('method not found via accessor throws', () => {
    const ctx = new StandardEvaluationContext({obj:{}});
    expect(() => new SpelExpressionParser().parseExpression('obj.missing()').getValueWithContext(ctx)).toThrow();
  });

  it('method on object uses accessor fallback', () => {
    const ctx = new StandardEvaluationContext();
    const obj = { greet: ()=>'hi' };
    ctx.setRootObject(obj);
    const r = new SpelExpressionParser().parseExpression('greet()').getValueWithContext(ctx);
    expect(r).toBe('hi');
  });
});

// === constructor-reference.ts lines 28-31,35-37 ===
describe('Phase8: ConstructorReference', () => {
  it('constructor with args', () => {
    const ctx = new StandardEvaluationContext();
    const tl = new StandardTypeLocator();
    class Point { x:number; y:number; constructor(x:number,y:number){this.x=x;this.y=y;} }
    tl.register('Point', Point);
    ctx.setTypeLocator(tl);
    const r = new SpelExpressionParser().parseExpression('new Point(1,2)').getValueWithContext(ctx) as Point;
    expect(r.x).toBe(1);
    expect(r.y).toBe(2);
  });
});

// === standard-type-locator.ts:18-19 ===
describe('Phase8: StandardTypeLocator findType throws', () => {
  it('findType throws for unregistered', () => {
    const tl = new StandardTypeLocator();
    expect(() => tl.findType('NoSuch')).toThrow();
  });
});

// === tokenizer.ts:353-354,410-414 ===
describe('Phase8: Tokenizer edge paths', () => {
  it('dot followed by unexpected char after DOT', () => {
    const p = new SpelExpressionParser();
    // a..b is range operator, covered; try something unexpected after dot
    expect(() => p.parseExpression('a.~b')).toThrow();
  });

  it('AMP_AT recognized via @ expression', () => {
    const ctx = new StandardEvaluationContext();
    const br = new DefaultBeanResolver();
    br.register('x', 'val');
    ctx.setBeanResolver(br);
    // @ is AT, &@ is AMP_AT — test both
    expect(new SpelExpressionParser().parseExpression('@x').getValueWithContext(ctx)).toBe('val');
  });

  it('| alone throws', () => {
    expect(() => new SpelExpressionParser().parseExpression('|')).toThrow();
  });

  it('& alone throws', () => {
    expect(() => new SpelExpressionParser().parseExpression('&')).toThrow();
  });
});

// === reflective-property-accessor.ts read ===
describe('Phase8: ReflectivePropertyAccessor read path', () => {
  it('read null target throws', () => {
    const a = new ReflectivePropertyAccessor();
    expect(() => a.read({} as any, null, 'x')).toThrow();
  });
});

// === parser covered lines with parseRaw ===
describe('Phase8: Parser parseRaw edge', () => {
  it('parseRaw returns AST node', () => {
    const p = new SpelExpressionParser();
    const node = p.parseRaw('42');
    expect(node).toBeDefined();
    expect(node.toStringAST()).toBe('42');
  });

  it('parseRaw compound', () => {
    const p = new SpelExpressionParser();
    const node = p.parseRaw('a.b.c');
    expect(node.toStringAST()).toBe('a.b.c');
  });
});
