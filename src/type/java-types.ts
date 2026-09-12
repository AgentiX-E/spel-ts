/**
 * The `java.lang` type catalogue.
 *
 * SpEL resolves `T(...)` against real Java classes. A JavaScript port cannot do
 * that — there is no class loader — so the types this library supports are
 * declared here with a JavaScript implementation of their static surface, and
 * `T(...)`, `instanceof` and `new ...` resolve against this catalogue.
 *
 * Scope is deliberate: the types and members below are the ones SpEL programs
 * reach for in practice, plus everything `README.md` advertises. Nothing is
 * claimed beyond what is implemented, and anything absent raises the same
 * `TYPE_NOT_FOUND` that Spring raises for an unknown class.
 */
import type { TypeDescriptor } from './type-descriptor.js';
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';

interface JavaTypeDefinition {
  readonly name: string;
  /**
   * Used only so the descriptor has a constructor reference; see `newInstance`.
   * The parameter type is `unknown` rather than `never` so that the real
   * constructors (`String`, `Number`, `Date`, …) are assignable to it.
   */
  readonly constructor: new (...args: unknown[]) => unknown;
  readonly staticMethods?: Readonly<Record<string, (...args: unknown[]) => unknown>>;
  readonly staticFields?: Readonly<Record<string, unknown>>;
  readonly isInstance: (value: unknown, kind?: string) => boolean;
  readonly newInstance?: (...args: unknown[]) => unknown;
  readonly instantiable?: boolean;
}

const NOT_INSTANTIABLE = 'type cannot be instantiated';

function isNumberLike(value: unknown): value is number {
  return typeof value === 'number';
}

function toNumber(value: unknown, method: string): number {
  if (isNumberLike(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  throw new SpelEvaluationException(-1, SpelMessage.TYPE_CONVERSION_ERROR, method, 'number');
}

function toStringArg(value: unknown, method: string): string {
  if (typeof value === 'string') {
    return value;
  }
  throw new SpelEvaluationException(-1, SpelMessage.TYPE_CONVERSION_ERROR, method, 'String');
}

/**
 * `String.valueOf` accepts anything, as it does in Java: a null argument renders
 * as the literal `null`, and everything else renders through its own description.
 * Java's `Object#toString` is equally generic for a value that does not override
 * it, so a non-primitive is described by its type rather than converted the way
 * the host would convert it — `1,2` and a locale-dependent date string are
 * JavaScript-isms that no Java type produces.
 */
function valueOfString(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value.toString();
  }
  return Object.prototype.toString.call(value);
}

/**
 * A documented subset of `String.format`.
 *
 * Supports `%s`, `%d`, `%f`, `%.Nf`, `%x`, `%X`, `%o`, `%b`, `%c`, `%%`, with an
 * optional `-` or `0` flag and an optional width. Java's full conversion set,
 * argument indexes and locale-sensitive forms are not implemented, and an
 * unsupported conversion raises rather than being passed through, so a caller
 * cannot silently receive unformatted text.
 */
function javaStringFormat(template: string, args: readonly unknown[]): string {
  let argumentIndex = 0;
  const pattern = /%(?:(-|0)?)(\d+)?(?:\.(\d+))?([sdfxXobc%])/g;

  return template.replace(
    pattern,
    (
      _match: string,
      // An optional capture group arrives as `undefined` when it does not
      // participate in the match, so the groups are typed as optional even though
      // `String#replace` declares them as `string`.
      flag: string | undefined,
      width: string | undefined,
      precision: string | undefined,
      conversion: string,
    ) => {
      if (conversion === '%') {
        return '%';
      }

      const argument = args[argumentIndex];
      argumentIndex += 1;

      let rendered: string;
      switch (conversion) {
        case 's':
          rendered = String(argument);
          break;
        case 'd':
          rendered = String(Math.trunc(toNumber(argument, 'format')));
          break;
        case 'f': {
          const digits = precision === undefined ? 6 : Number(precision);
          rendered = toNumber(argument, 'format').toFixed(digits);
          break;
        }
        case 'x':
          rendered = Math.trunc(toNumber(argument, 'format')).toString(16);
          break;
        case 'X':
          rendered = Math.trunc(toNumber(argument, 'format')).toString(16).toUpperCase();
          break;
        case 'o':
          rendered = Math.trunc(toNumber(argument, 'format')).toString(8);
          break;
        case 'b':
          rendered = String(Boolean(argument));
          break;
        case 'c':
          rendered = String(argument);
          break;
        default:
          throw new SpelEvaluationException(
            -1,
            SpelMessage.METHOD_NOT_FOUND,
            `format conversion %${conversion}`,
            'String',
          );
      }

      if (width !== undefined) {
        const target = Number(width);
        rendered =
          flag === '-'
            ? rendered.padEnd(target, ' ')
            : rendered.padStart(target, flag === '0' ? '0' : ' ');
      }
      return rendered;
    },
  );
}

/** A numeric value in either host representation; `bigint` stands for BigInteger. */
function isNumericValue(value: unknown): value is number | bigint {
  return typeof value === 'number' || typeof value === 'bigint';
}

/**
 * The kinds each boxed wrapper accepts. A `bigint` stands in for the Java long
 * values a JavaScript number cannot hold, so it satisfies `Long`; `float` is
 * deliberately absent because java.lang.Float is not in the catalogue.
 */
const INTEGRAL_KINDS: readonly string[] = ['int'];
const LONG_KINDS: readonly string[] = ['long', 'bigint'];
const DOUBLE_KINDS: readonly string[] = ['double'];

const isIntegralValue = (value: number | bigint): boolean =>
  typeof value === 'bigint' || Number.isInteger(value);

const isFractionalValue = (value: number | bigint): boolean =>
  typeof value !== 'bigint' && !Number.isInteger(value);

/**
 * The boxed numeric wrappers differ only in the kind their operand was written
 * as, so `instanceof` consults that kind whenever the engine can supply it.
 * `1.0` and `1` are the same host value yet a `double` and an `int` in Java, and
 * `1 instanceof T(Long)` is false for the same reason: the kinds are not
 * interchangeable, so each wrapper names the ones it accepts.
 *
 * A value arriving from the context carries no Java type in this port, so when
 * the kind is absent the host representation is the closest approximation.
 */
function isBoxedOfKind(
  value: unknown,
  kind: string | undefined,
  accepted: readonly string[],
  approximate: (value: number | bigint) => boolean,
): boolean {
  if (!isNumericValue(value)) {
    return false;
  }
  return kind === undefined ? approximate(value) : accepted.includes(kind);
}

/**
 * The catalogue. `java.lang` names are resolvable unqualified, as in Java.
 */
export const JAVA_TYPE_DEFINITIONS: readonly JavaTypeDefinition[] = [
  {
    name: 'java.lang.Object',
    constructor: Object,
    isInstance: (value) => value !== null && value !== undefined,
  },
  {
    name: 'java.lang.Number',
    constructor: Number,
    // `bigint` stands in for java.math.BigInteger, which extends Number.
    isInstance: (value) => isNumericValue(value),
  },
  {
    name: 'java.lang.Math',
    constructor: Object,
    instantiable: false,
    staticFields: {
      PI: Math.PI,
      E: Math.E,
    },
    staticMethods: {
      abs: (value) => Math.abs(toNumber(value, 'abs')),
      ceil: (value) => Math.ceil(toNumber(value, 'ceil')),
      floor: (value) => Math.floor(toNumber(value, 'floor')),
      round: (value) => Math.round(toNumber(value, 'round')),
      signum: (value) => Math.sign(toNumber(value, 'signum')),
      max: (left, right) => Math.max(toNumber(left, 'max'), toNumber(right, 'max')),
      min: (left, right) => Math.min(toNumber(left, 'min'), toNumber(right, 'min')),
      pow: (base, exponent) => Math.pow(toNumber(base, 'pow'), toNumber(exponent, 'pow')),
      sqrt: (value) => Math.sqrt(toNumber(value, 'sqrt')),
      cbrt: (value) => Math.cbrt(toNumber(value, 'cbrt')),
      exp: (value) => Math.exp(toNumber(value, 'exp')),
      log: (value) => Math.log(toNumber(value, 'log')),
      log10: (value) => Math.log10(toNumber(value, 'log10')),
      hypot: (left, right) => Math.hypot(toNumber(left, 'hypot'), toNumber(right, 'hypot')),
      toRadians: (value) => (toNumber(value, 'toRadians') * Math.PI) / 180,
      toDegrees: (value) => (toNumber(value, 'toDegrees') * 180) / Math.PI,
      random: () => Math.random(),
    },
    isInstance: () => false,
  },
  {
    name: 'java.lang.String',
    constructor: String,
    staticMethods: {
      valueOf: (value: unknown) => valueOfString(value),
      format: (template, ...rest) => javaStringFormat(toStringArg(template, 'format'), rest),
      join: (separator, ...rest) =>
        rest.map((item) => String(item)).join(toStringArg(separator, 'join')),
    },
    isInstance: (value) => typeof value === 'string',
    // `new String(x)` has no counterpart for a non-string in Java, so anything
    // else is reported rather than stringified.
    newInstance: (value) => (value === undefined ? '' : toStringArg(value, 'new String')),
  },
  {
    name: 'java.lang.Integer',
    constructor: Number,
    staticFields: {
      MAX_VALUE: 2147483647,
      MIN_VALUE: -2147483648,
    },
    staticMethods: {
      parseInt: (text, radix) =>
        Number.parseInt(
          toStringArg(text, 'parseInt'),
          radix === undefined ? 10 : toNumber(radix, 'parseInt'),
        ),
      valueOf: (value: unknown) => Math.trunc(toNumber(value, 'valueOf')),
      toString: (value: unknown, radix: unknown) =>
        Math.trunc(toNumber(value, 'toString')).toString(
          radix === undefined ? 10 : toNumber(radix, 'toString'),
        ),
      compare: (left, right) => Math.sign(toNumber(left, 'compare') - toNumber(right, 'compare')),
      max: (left, right) => Math.max(toNumber(left, 'max'), toNumber(right, 'max')),
      min: (left, right) => Math.min(toNumber(left, 'min'), toNumber(right, 'min')),
    },
    isInstance: (value, kind) => isBoxedOfKind(value, kind, INTEGRAL_KINDS, isIntegralValue),
  },
  {
    name: 'java.lang.Long',
    constructor: Number,
    staticFields: {
      // Beyond float64, so they are BigInt to stay exact — the same kind a
      // literal of this magnitude is parsed into. As numbers they would round to
      // ...776000 and arithmetic on them would be nonsense.
      MAX_VALUE: 9223372036854775807n,
      MIN_VALUE: -9223372036854775808n,
    },
    staticMethods: {
      parseLong: (text, radix) =>
        Number.parseInt(
          toStringArg(text, 'parseLong'),
          radix === undefined ? 10 : toNumber(radix, 'parseLong'),
        ),
      valueOf: (value: unknown) => Math.trunc(toNumber(value, 'valueOf')),
      toString: (value: unknown, radix: unknown) =>
        Math.trunc(toNumber(value, 'toString')).toString(
          radix === undefined ? 10 : toNumber(radix, 'toString'),
        ),
    },
    isInstance: (value, kind) => isBoxedOfKind(value, kind, LONG_KINDS, isIntegralValue),
  },
  {
    name: 'java.lang.Double',
    constructor: Number,
    staticFields: {
      MAX_VALUE: Number.MAX_VALUE,
      MIN_VALUE: Number.MIN_VALUE,
      POSITIVE_INFINITY: Number.POSITIVE_INFINITY,
      NEGATIVE_INFINITY: Number.NEGATIVE_INFINITY,
      NaN: Number.NaN,
    },
    staticMethods: {
      parseDouble: (text) => Number(toStringArg(text, 'parseDouble')),
      valueOf: (value: unknown) => toNumber(value, 'valueOf'),
      isNaN: (value) => Number.isNaN(toNumber(value, 'isNaN')),
      isInfinite: (value) => !Number.isFinite(toNumber(value, 'isInfinite')),
      toString: (value: unknown) => String(toNumber(value, 'toString')),
    },
    isInstance: (value, kind) => isBoxedOfKind(value, kind, DOUBLE_KINDS, isFractionalValue),
  },
  {
    name: 'java.lang.Boolean',
    constructor: Boolean,
    staticFields: {
      TRUE: true,
      FALSE: false,
    },
    staticMethods: {
      parseBoolean: (value) => toStringArg(value, 'parseBoolean').toLowerCase() === 'true',
      valueOf: (value: unknown) => Boolean(value),
    },
    isInstance: (value) => typeof value === 'boolean',
    newInstance: (value) => Boolean(value),
  },
  {
    name: 'java.lang.Character',
    constructor: String,
    staticMethods: {
      isDigit: (value) => /^[0-9]$/.test(toStringArg(value, 'isDigit')),
      isLetter: (value) => /^\p{L}$/u.test(toStringArg(value, 'isLetter')),
      toUpperCase: (value) => toStringArg(value, 'toUpperCase').toUpperCase(),
      toLowerCase: (value) => toStringArg(value, 'toLowerCase').toLowerCase(),
    },
    isInstance: (value) => typeof value === 'string' && value.length === 1,
  },
  {
    name: 'java.util.Date',
    constructor: Date,
    staticMethods: {
      now: () => Date.now(),
      parse: (text) => Date.parse(toStringArg(text, 'parse')),
    },
    isInstance: (value) => value instanceof Date,
    newInstance: (...args) => new Date(...(args as [])),
  },
];

/**
 * Build a `TypeDescriptor` from a definition, filling the members the interface
 * requires but that a given type does not need.
 */
export function createTypeDescriptor(definition: JavaTypeDefinition): TypeDescriptor {
  const staticMethods = definition.staticMethods ?? {};
  const staticFields = definition.staticFields ?? {};

  return {
    name: definition.name,
    constructor: definition.constructor,
    staticMethods,
    staticFields,
    isInstance: definition.isInstance,
    newInstance(...args: unknown[]): unknown {
      if (definition.instantiable === false || definition.newInstance === undefined) {
        throw new SpelEvaluationException(
          -1,
          SpelMessage.CONSTRUCTOR_NOT_FOUND,
          `${definition.name}: ${NOT_INSTANTIABLE}`,
        );
      }
      return definition.newInstance(...args);
    },
    callStaticMethod(name: string, ...args: unknown[]): unknown {
      const method = staticMethods[name];
      if (typeof method !== 'function') {
        throw new SpelEvaluationException(-1, SpelMessage.METHOD_NOT_FOUND, name, definition.name);
      }
      return method(...args);
    },
    getStaticField(name: string): unknown {
      if (name in staticFields) {
        return staticFields[name];
      }
      throw new SpelEvaluationException(
        -1,
        SpelMessage.PROPERTY_OR_FIELD_NOT_READABLE,
        `${definition.name}.${name}`,
      );
    },
  };
}
