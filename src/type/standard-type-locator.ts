import type { TypeDescriptor } from './type-descriptor.js';
import type { TypeLocator } from './type-locator.js';
import { JAVA_TYPE_DEFINITIONS, createTypeDescriptor } from './java-types.js';
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';

/** Prefixes tried for an unqualified type name, as Java's implicit imports do. */
const DEFAULT_PREFIXES: readonly string[] = ['java.lang.'];

/**
 * Parallels Spring StandardTypeLocator.
 *
 * Resolves the names used by `T(...)`, `instanceof` and `new ...`.
 *
 * Two behaviours matter and both mirror Spring:
 *
 *  - `java.lang` is imported implicitly, so `T(String)` and `T(java.lang.String)`
 *    are the same type. An unqualified name that is not found is retried with
 *    each registered prefix.
 *  - The catalogue of available types is explicit (see `java-types.ts`). Where
 *    Spring consults a class loader, this port has a registry, so a type that is
 *    not registered raises `TYPE_NOT_FOUND` rather than being loaded on demand.
 */
export class StandardTypeLocator implements TypeLocator {
  private readonly types = new Map<string, TypeDescriptor>();
  private readonly prefixes: string[];

  /**
   * @param prefixes Package prefixes tried for an unqualified name. Defaults to
   *   `java.lang`, matching Java's implicit import.
   */
  constructor(prefixes: readonly string[] = DEFAULT_PREFIXES) {
    this.prefixes = prefixes.map((prefix) => (prefix.endsWith('.') ? prefix : `${prefix}.`));

    for (const definition of JAVA_TYPE_DEFINITIONS) {
      this.types.set(definition.name, createTypeDescriptor(definition));
    }
  }

  public findType(typeName: string): TypeDescriptor {
    const exact = this.types.get(typeName);
    if (exact !== undefined) {
      return exact;
    }

    // An unqualified name is resolved against the implicit imports, so
    // `T(String)` finds `java.lang.String` just as it does in Java.
    if (!typeName.includes('.')) {
      for (const prefix of this.prefixes) {
        const imported = this.types.get(prefix + typeName);
        if (imported !== undefined) {
          return imported;
        }
      }
    }

    throw new SpelEvaluationException(-1, SpelMessage.TYPE_NOT_FOUND, typeName);
  }

  public registerType(name: string, descriptor: TypeDescriptor): void {
    this.types.set(name, descriptor);
  }

  public hasType(name: string): boolean {
    if (this.types.has(name)) {
      return true;
    }
    return this.prefixes.some((prefix) => this.types.has(prefix + name));
  }

  /**
   * Add a package prefix for unqualified names, mirroring Spring's
   * `registerImport`.
   */
  public registerImport(prefix: string): void {
    const normalised = prefix.endsWith('.') ? prefix : `${prefix}.`;
    if (!this.prefixes.includes(normalised)) {
      this.prefixes.push(normalised);
    }
  }

  /**
   * Convenience: register a JavaScript constructor as a type.
   * Automatically creates a TypeDescriptor wrapping the constructor.
   */
  public register(
    name: string,
    constructor: new (...args: unknown[]) => unknown,
    staticMethods: Record<string, (...args: unknown[]) => unknown> = {},
    staticFields: Record<string, unknown> = {},
  ): void {
    const descriptor: TypeDescriptor = {
      name,
      constructor,
      staticMethods,
      staticFields,
      isInstance(value: unknown): boolean {
        return value instanceof constructor;
      },
      newInstance(...args: unknown[]): unknown {
        return new constructor(...args);
      },
      callStaticMethod(methodName: string, ...args: unknown[]): unknown {
        const method = staticMethods[methodName];
        if (typeof method === 'function') {
          return method(...args);
        }
        // Try prototype method
        const protoMethod = (constructor.prototype as Record<string, unknown>)[methodName];
        if (typeof protoMethod === 'function') {
          return (protoMethod as (...a: unknown[]) => unknown)(...args);
        }
        throw new SpelEvaluationException(-1, SpelMessage.METHOD_NOT_FOUND, methodName, this.name);
      },
      getStaticField(fieldName: string): unknown {
        if (fieldName in staticFields) return staticFields[fieldName];
        // Try constructor property
        const ctor = constructor as unknown as Record<string, unknown>;
        if (fieldName in ctor) return ctor[fieldName];
        throw new SpelEvaluationException(
          -1,
          SpelMessage.PROPERTY_OR_FIELD_NOT_READABLE,
          fieldName,
        );
      },
    };
    this.types.set(name, descriptor);
  }
}
