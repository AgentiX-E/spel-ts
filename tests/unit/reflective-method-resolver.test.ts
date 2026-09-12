/**
 * Contract tests for the reflective method resolver's dispatch.
 *
 * The dispatch order is the part that matters. A string is resolved against
 * `java.lang.String` and nothing else, because JavaScript's String shares
 * several names with different semantics; everything else falls back to its own
 * methods. These tests pin that order, since getting it wrong is what allowed
 * `replaceAll` to silently ignore its regular expression.
 */
import { describe, expect, it } from 'vitest';
import { ReflectiveMethodResolver } from '../../src/evaluation-context/reflective-method-resolver.js';
import { SpelEvaluationException } from '../../src/error/spel-evaluation-exception.js';
import { StandardEvaluationContext } from '../../src/standard-evaluation-context.js';
import { StandardTypeLocator } from '../../src/type/standard-type-locator.js';

const resolver = new ReflectiveMethodResolver();
const context = new StandardEvaluationContext();

describe('ReflectiveMethodResolver — absent targets', () => {
  it('returns null for null and undefined', () => {
    expect(resolver.resolve(context, null, 'anything', [])).toBeNull();
    expect(resolver.resolve(context, undefined, 'anything', [])).toBeNull();
  });
});

describe('ReflectiveMethodResolver — strings', () => {
  it('resolves java.lang.String methods', () => {
    expect(resolver.resolve(context, 'abc', 'length', [])?.getValue()).toBe(3);
    expect(resolver.resolve(context, 'a1b2', 'replaceAll', ['\\d', '-'])?.getValue()).toBe('a-b-');
  });

  it('returns null for a name JavaScript has and Java does not', () => {
    // Spring raises method-not-found here, so this must not resolve.
    expect(resolver.resolve(context, 'ab', 'includes', ['a'])).toBeNull();
    expect(resolver.resolve(context, 'ab', 'padStart', [4])).toBeNull();
  });
});

describe('ReflectiveMethodResolver — other targets', () => {
  it('invokes a method on a plain object', () => {
    const target = {
      greet(name: string): string {
        return `hello ${name}`;
      },
    };
    expect(resolver.resolve(context, target, 'greet', ['world'])?.getValue()).toBe('hello world');
  });

  it('reports an exception raised by the invoked method', () => {
    const target = {
      explode(): never {
        throw new Error('boom');
      },
    };
    expect(() => resolver.resolve(context, target, 'explode', [])).toThrow(SpelEvaluationException);
  });

  it('returns null when the target has no such member', () => {
    expect(resolver.resolve(context, { a: 1 }, 'missing', [])).toBeNull();
    expect(resolver.resolve(context, { a: 1 }, 'a', [])).toBeNull();
  });

  it('resolves a number method through its own methods', () => {
    expect(resolver.resolve(context, 42, 'toString', [])?.getValue()).toBe('42');
    expect(resolver.resolve(context, 42, 'toFixed', [])?.getValue()).toBe('42');
    expect(resolver.resolve(context, 42, 'nonExistent', [])).toBeNull();
  });

  it('invokes a method on an array', () => {
    expect(resolver.resolve(context, [3, 1, 2], 'join', ['-'])?.getValue()).toBe('3-1-2');
  });
});

describe('ReflectiveMethodResolver — resolved type handles', () => {
  const typeLocator = new StandardTypeLocator();

  it('calls a static method on a type handle', () => {
    const handle = typeLocator.findType('java.lang.Math');
    expect(resolver.resolve(context, handle, 'abs', [-5])?.getValue()).toBe(5);
  });

  it('does not let a JavaScript prototype member win the lookup', () => {
    // `valueOf` exists on Object.prototype. Without an explicit branch the
    // resolver would call it and hand back the handle itself, so
    // `T(String).valueOf(42)` returned the handle instead of '42'.
    const handle = typeLocator.findType('java.lang.String');
    expect(resolver.resolve(context, handle, 'valueOf', [42])?.getValue()).toBe('42');
  });

  it('reports an unknown static method', () => {
    const handle = typeLocator.findType('java.lang.Math');
    expect(() => resolver.resolve(context, handle, 'noSuchMethod', [])).toThrow(
      SpelEvaluationException,
    );
  });
});
