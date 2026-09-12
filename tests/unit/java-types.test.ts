/**
 * Contract tests for the java.lang type catalogue and its locator.
 *
 * Two things are protected here. The first is that the surface README advertises
 * actually resolves — `T(java.lang.Math)`, `instanceof` and `new ...` all failed
 * before, because the default context held a stub locator. The second is that an
 * unknown name or member reports rather than resolving to a plausible value,
 * which is the failure mode this whole programme exists to remove.
 */
import { describe, expect, it } from 'vitest';
import { SpelEvaluationException } from '../../src/error/spel-evaluation-exception.js';
import { StandardTypeLocator } from '../../src/type/standard-type-locator.js';
import { createTypeDescriptor, JAVA_TYPE_DEFINITIONS } from '../../src/type/java-types.js';

const locator = new StandardTypeLocator();

function descriptor(name: string) {
  return locator.findType(name);
}

describe('StandardTypeLocator resolution', () => {
  it('resolves a fully qualified name', () => {
    expect(descriptor('java.lang.Math').name).toBe('java.lang.Math');
  });

  it('resolves an unqualified name through the implicit java.lang import', () => {
    expect(descriptor('Math').name).toBe('java.lang.Math');
    expect(descriptor('String').name).toBe('java.lang.String');
    expect(descriptor('Integer').name).toBe('java.lang.Integer');
  });

  it('reports an unknown name', () => {
    expect(() => descriptor('NoSuchType')).toThrow(SpelEvaluationException);
    expect(() => descriptor('java.lang.NoSuchType')).toThrow(SpelEvaluationException);
  });

  it('hasType accounts for the implicit import', () => {
    expect(locator.hasType('Math')).toBe(true);
    expect(locator.hasType('java.lang.Math')).toBe(true);
    expect(locator.hasType('NoSuchType')).toBe(false);
  });

  it('supports an additional import prefix', () => {
    const custom = new StandardTypeLocator();
    custom.register('com.example.Widget', class Widget {});
    expect(custom.hasType('com.example.Widget')).toBe(true);
    custom.registerImport('com.example');
    expect(custom.hasType('Widget')).toBe(true);
    expect(custom.findType('Widget').name).toBe('com.example.Widget');
  });

  it('registers every definition in the catalogue', () => {
    for (const definition of JAVA_TYPE_DEFINITIONS) {
      expect(locator.hasType(definition.name)).toBe(true);
    }
  });
});

describe('java.lang.Math', () => {
  it('exposes static fields', () => {
    expect(descriptor('Math').getStaticField('PI')).toBe(Math.PI);
    expect(descriptor('Math').getStaticField('E')).toBe(Math.E);
  });

  it('is not instantiable', () => {
    expect(() => descriptor('Math').newInstance()).toThrow(SpelEvaluationException);
  });

  it('reports an unknown member', () => {
    expect(() => descriptor('Math').callStaticMethod('noSuchMethod')).toThrow(
      SpelEvaluationException,
    );
    expect(() => descriptor('Math').getStaticField('NO_SUCH_FIELD')).toThrow(
      SpelEvaluationException,
    );
  });

  it('exposes the whole declared method table', () => {
    const call = (name: string, ...args: unknown[]): unknown =>
      descriptor('Math').callStaticMethod(name, ...args);

    expect(call('abs', -5)).toBe(5);
    expect(call('ceil', 1.2)).toBe(2);
    expect(call('floor', 1.8)).toBe(1);
    expect(call('round', 2.5)).toBe(3);
    expect(call('signum', -3)).toBe(-1);
    expect(call('max', 3, 7)).toBe(7);
    expect(call('min', 3, 7)).toBe(3);
    expect(call('pow', 2, 10)).toBe(1024);
    expect(call('sqrt', 16)).toBe(4);
    expect(call('cbrt', 27)).toBeCloseTo(3, 12);
    expect(call('exp', 0)).toBe(1);
    expect(call('log', Math.E)).toBeCloseTo(1, 12);
    expect(call('log10', 1000)).toBeCloseTo(3, 12);
    expect(call('hypot', 3, 4)).toBe(5);
    expect(call('toRadians', 180)).toBeCloseTo(Math.PI, 12);
    expect(call('toDegrees', Math.PI)).toBeCloseTo(180, 12);

    const random = call('random') as number;
    expect(random).toBeGreaterThanOrEqual(0);
    expect(random).toBeLessThan(1);
  });

  it('does not expose a method java.lang.Math does not declare', () => {
    // `trunc` is a JavaScript name. Java's closest methods are `rint` and
    // `round`, and neither truncates toward zero; the catalogue has neither.
    expect(() => descriptor('Math').callStaticMethod('truncate', 1.5)).toThrow(
      SpelEvaluationException,
    );
  });
});

describe('java.lang numeric wrappers', () => {
  it('exposes the boundary constants', () => {
    expect(descriptor('Integer').getStaticField('MAX_VALUE')).toBe(2147483647);
    expect(descriptor('Integer').getStaticField('MIN_VALUE')).toBe(-2147483648);
    expect(descriptor('Double').getStaticField('POSITIVE_INFINITY')).toBe(Number.POSITIVE_INFINITY);
  });

  it('exposes the 64-bit boundaries exactly', () => {
    // Both are beyond float64. As numbers they would round to ...776000, and
    // `T(Long).MAX_VALUE - 1` evaluated to 0 — a wrong answer, not an error.
    expect(descriptor('Long').getStaticField('MAX_VALUE')).toBe(9223372036854775807n);
    expect(descriptor('Long').getStaticField('MIN_VALUE')).toBe(-9223372036854775808n);
  });

  it('parses text', () => {
    expect(descriptor('Integer').callStaticMethod('parseInt', '42')).toBe(42);
    expect(descriptor('Integer').callStaticMethod('parseInt', 'ff', 16)).toBe(255);
    expect(descriptor('Long').callStaticMethod('parseLong', '99')).toBe(99);
    expect(descriptor('Double').callStaticMethod('parseDouble', '1.5')).toBe(1.5);
  });

  it('reports a non-numeric argument rather than coercing', () => {
    expect(() => descriptor('Math').callStaticMethod('abs', 'abc')).toThrow(
      SpelEvaluationException,
    );
    expect(() => descriptor('Integer').callStaticMethod('parseInt', 42)).toThrow(
      SpelEvaluationException,
    );
  });

  it('classifies instances by JavaScript type', () => {
    expect(descriptor('Integer').isInstance(1)).toBe(true);
    expect(descriptor('Integer').isInstance('1')).toBe(false);
    expect(descriptor('Double').isInstance(1.5)).toBe(true);
    expect(descriptor('Double').isInstance(1)).toBe(false);
    expect(descriptor('Boolean').isInstance(true)).toBe(true);
    expect(descriptor('String').isInstance('a')).toBe(true);
    expect(descriptor('Character').isInstance('a')).toBe(true);
    expect(descriptor('Character').isInstance('ab')).toBe(false);
    expect(descriptor('Object').isInstance(1)).toBe(true);
    expect(descriptor('Object').isInstance(null)).toBe(false);
    expect(descriptor('Number').isInstance(1)).toBe(true);
    expect(descriptor('Long').isInstance(1)).toBe(true);
    expect(descriptor('Long').isInstance(1.5)).toBe(false);
    // A static-only class has no instances.
    expect(descriptor('Math').isInstance(1)).toBe(false);
    expect(descriptor('Boolean').newInstance(true)).toBe(true);
  });

  it('classifies a boxed type from the kind, not from the host value', () => {
    // `1.0` and `1` are the same JavaScript number; only the kind tells them
    // apart, and it is what `instanceof T(Double)` has to consult.
    expect(descriptor('Double').isInstance(1, 'double')).toBe(true);
    expect(descriptor('Integer').isInstance(1, 'double')).toBe(false);
    expect(descriptor('Long').isInstance(1, 'int')).toBe(false);
    expect(descriptor('Long').isInstance(1, 'long')).toBe(true);
    expect(descriptor('Long').isInstance(9007199254740993n, 'bigint')).toBe(true);
    expect(descriptor('Integer').isInstance(9007199254740993n, 'bigint')).toBe(false);
    // A non-numeric operand is not a boxed numeric type, whatever the kind says.
    expect(descriptor('Double').isInstance('1.5', 'double')).toBe(false);
  });

  it('exposes the boxed conversions', () => {
    expect(descriptor('Integer').callStaticMethod('valueOf', '42')).toBe(42);
    expect(descriptor('Integer').callStaticMethod('toString', 42)).toBe('42');
    expect(descriptor('Integer').callStaticMethod('toString', 255, 16)).toBe('ff');
    expect(descriptor('Integer').callStaticMethod('compare', 1, 2)).toBe(-1);
    expect(descriptor('Integer').callStaticMethod('max', 3, 7)).toBe(7);
    expect(descriptor('Integer').callStaticMethod('min', 3, 7)).toBe(3);

    expect(descriptor('Long').callStaticMethod('valueOf', '99')).toBe(99);
    expect(descriptor('Long').callStaticMethod('toString', 99)).toBe('99');

    expect(descriptor('Double').callStaticMethod('valueOf', '1.5')).toBe(1.5);
    expect(descriptor('Double').callStaticMethod('toString', 1.5)).toBe('1.5');
    expect(descriptor('Double').callStaticMethod('isNaN', Number.NaN)).toBe(true);
    expect(descriptor('Double').callStaticMethod('isNaN', 1)).toBe(false);
    expect(descriptor('Double').callStaticMethod('isInfinite', Number.POSITIVE_INFINITY)).toBe(
      true,
    );
    expect(descriptor('Double').callStaticMethod('isInfinite', 1)).toBe(false);

    expect(descriptor('Boolean').callStaticMethod('valueOf', 'true')).toBe(true);
  });

  it('exposes the remaining numeric constants', () => {
    expect(descriptor('Double').getStaticField('NEGATIVE_INFINITY')).toBe(Number.NEGATIVE_INFINITY);
    expect(Number.isNaN(descriptor('Double').getStaticField('NaN') as number)).toBe(true);
    expect(descriptor('Boolean').getStaticField('TRUE')).toBe(true);
    expect(descriptor('Boolean').getStaticField('FALSE')).toBe(false);
  });
});

describe('java.lang.Character statics', () => {
  it('classifies and converts a single character', () => {
    expect(descriptor('Character').callStaticMethod('isDigit', '5')).toBe(true);
    expect(descriptor('Character').callStaticMethod('isDigit', 'a')).toBe(false);
    expect(descriptor('Character').callStaticMethod('isLetter', 'a')).toBe(true);
    expect(descriptor('Character').callStaticMethod('isLetter', '5')).toBe(false);
    expect(descriptor('Character').callStaticMethod('toUpperCase', 'a')).toBe('A');
    expect(descriptor('Character').callStaticMethod('toLowerCase', 'A')).toBe('a');
  });
});

describe('java.lang.String statics', () => {
  it('formats the documented conversions', () => {
    const format = (template: string, ...args: unknown[]): unknown =>
      descriptor('String').callStaticMethod('format', template, ...args);

    expect(format('%s and %s', 'a', 'b')).toBe('a and b');
    expect(format('%d', 42)).toBe('42');
    expect(format('%.2f', 3.14159)).toBe('3.14');
    expect(format('%f', 1.5)).toBe('1.500000');
    expect(format('%x', 255)).toBe('ff');
    expect(format('%X', 255)).toBe('FF');
    expect(format('%o', 8)).toBe('10');
    expect(format('%b', 1)).toBe('true');
    expect(format('%5d|', 42)).toBe('   42|');
    expect(format('%-5d|', 42)).toBe('42   |');
    expect(format('%05d', 42)).toBe('00042');
    expect(format('100%%')).toBe('100%');
  });

  it('valueOf renders null as the Java literal', () => {
    const valueOf = (input: unknown): unknown =>
      descriptor('String').callStaticMethod('valueOf', input);
    expect(valueOf(42)).toBe('42');
    expect(valueOf('a')).toBe('a');
    expect(valueOf(10n)).toBe('10');
    expect(valueOf(true)).toBe('true');
    expect(valueOf(null)).toBe('null');
    expect(valueOf(undefined)).toBe('null');
  });

  it('valueOf renders a non-primitive through its generic description', () => {
    const valueOf = (input: unknown): unknown =>
      descriptor('String').callStaticMethod('valueOf', input);
    // Java's `String.valueOf(Object)` is `Object#toString`, which for anything
    // that does not override it is equally generic. Deliberately not the host's
    // own conversion, which produces JavaScript-isms such as `1,2` for an array
    // — a rendering no Java type produces.
    expect(valueOf({})).toBe('[object Object]');
    expect(valueOf([1, 2])).toBe('[object Array]');
  });

  it('join separates every element', () => {
    expect(descriptor('String').callStaticMethod('join', '-', 'a', 'b', 'c')).toBe('a-b-c');
  });

  it('constructs from a string and refuses anything else', () => {
    expect(descriptor('String').newInstance()).toBe('');
    expect(descriptor('String').newInstance('a')).toBe('a');
    // Java has no String(Object) constructor, so this reports rather than
    // stringifying the argument into '[object Object]'.
    expect(() => descriptor('String').newInstance(42)).toThrow(SpelEvaluationException);
  });
});

describe('java.util.Date', () => {
  it('constructs and classifies', () => {
    const epoch = descriptor('java.util.Date').newInstance(0);
    expect(epoch).toBeInstanceOf(Date);
    expect((epoch as Date).getTime()).toBe(0);
    expect(descriptor('java.util.Date').isInstance(epoch)).toBe(true);
    expect(descriptor('java.util.Date').isInstance('1970-01-01')).toBe(false);
  });

  it('exposes the date statics', () => {
    const now = descriptor('java.util.Date').callStaticMethod('now') as number;
    expect(now).toBeGreaterThan(0);
    expect(descriptor('java.util.Date').callStaticMethod('parse', '1970-01-01T00:00:00Z')).toBe(0);
  });
});

describe('createTypeDescriptor', () => {
  it('reports an unknown static method rather than returning undefined', () => {
    const descriptorFrom = createTypeDescriptor({
      name: 'com.example.Empty',
      constructor: Object,
      isInstance: () => false,
    });
    expect(() => descriptorFrom.callStaticMethod('go')).toThrow(SpelEvaluationException);
    expect(() => descriptorFrom.newInstance()).toThrow(SpelEvaluationException);
  });

  it('falls back to a prototype method for a registered class', () => {
    class Point {}
    const descriptorFrom = createTypeDescriptor({
      name: 'com.example.Point',
      constructor: Point,
      isInstance: () => false,
      newInstance: () => new Object(),
    });
    expect(descriptorFrom.newInstance()).toBeInstanceOf(Object);
    expect(descriptorFrom.isInstance(new Object())).toBe(false);
  });
});
