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
  /** Used only so the descriptor has a constructor reference; see `newInstance`. */
  readonly constructor: new (...args: never[]) => unknown;
  readonly staticMethods?: Readonly<Record<string, (...args: unknown[]) => unknown>>;
  readonly staticFields?: Readonly<Record<string, unknown>>;
  readonly isInstance: (value: unknown) => boolean;
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
    (_match, flag: string, width: string, precision: string, conversion: string) => {
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

/**
 * Boxed numeric wrappers differ only in the kind the expression engine already
 * tracks, so `instanceof` consults that kind when it is available. Without it,
 * a JavaScript number is assumed to be an integer, which is the closest
 * approximation available.
 */
function isIntegerOfKind(value: unknown, kind: string | undefined): boolean {
  if (!isNumberLike(value)) {
    return false;
  }
  if (kind === undefined) {
    return Number.isInteger(value);
  }
  return kind === 'int' || kind === 'long' || kind === 'bigint';
}

function isFloatingOfKind(value: unknown, kind: string | undefined): boolean {
  if (!isNumberLike(value)) {
    return false;
  }
  if (kind === undefined) {
    return !Number.isInteger(value);
  }
  return kind === 'float' || kind === 'double';
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
    isInstance: (value) => isNumberLike(value),
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
      truncate: (value) => Math.trunc(toNumber(value, 'truncate')),
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
      valueOf: (value) => (value === null || value === undefined ? 'null' : String(value)),
      format: (template, ...rest) => javaStringFormat(toStringArg(template, 'format'), rest),
      join: (separator, ...rest) =>
        rest.map((item) => String(item)).join(toStringArg(separator, 'join')),
    },
    isInstance: (value) => typeof value === 'string',
    newInstance: (value) => (value === undefined ? '' : String(value)),
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
      valueOf: (value) => Math.trunc(toNumber(value, 'valueOf')),
      toString: (value, radix) =>
        Math.trunc(toNumber(value, 'toString')).toString(
          radix === undefined ? 10 : toNumber(radix, 'toString'),
        ),
      compare: (left, right) => Math.sign(toNumber(left, 'compare') - toNumber(right, 'compare')),
      max: (left, right) => Math.max(toNumber(left, 'max'), toNumber(right, 'max')),
      min: (left, right) => Math.min(toNumber(left, 'min'), toNumber(right, 'min')),
    },
    isInstance: (value) => isIntegerOfKind(value, undefined),
  },
  {
    name: 'java.lang.Long',
    constructor: Number,
    staticFields: {
      MAX_VALUE: 9223372036854775807,
      MIN_VALUE: -9223372036854775808,
    },
    staticMethods: {
      parseLong: (text, radix) =>
        Number.parseInt(
          toStringArg(text, 'parseLong'),
          radix === undefined ? 10 : toNumber(radix, 'parseLong'),
        ),
      valueOf: (value) => Math.trunc(toNumber(value, 'valueOf')),
      toString: (value, radix) =>
        Math.trunc(toNumber(value, 'toString')).toString(
          radix === undefined ? 10 : toNumber(radix, 'toString'),
        ),
    },
    isInstance: (value) => isIntegerOfKind(value, undefined),
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
      valueOf: (value) => toNumber(value, 'valueOf'),
      isNaN: (value) => Number.isNaN(toNumber(value, 'isNaN')),
      isInfinite: (value) => !Number.isFinite(toNumber(value, 'isInfinite')),
      toString: (value) => String(toNumber(value, 'toString')),
    },
    isInstance: (value) => isFloatingOfKind(value, undefined),
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
      valueOf: (value) => Boolean(value),
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
