import type { TypeDescriptor } from './type-descriptor.js';
import type { TypeLocator } from './type-locator.js';
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';

export class StandardTypeLocator implements TypeLocator {
  private readonly types = new Map<string, TypeDescriptor>();

  public findType(typeName: string): TypeDescriptor {
    const descriptor = this.types.get(typeName);
    if (!descriptor) {
      throw new SpelEvaluationException(-1, SpelMessage.TYPE_NOT_FOUND, typeName);
    }
    return descriptor;
  }

  public registerType(name: string, descriptor: TypeDescriptor): void {
    this.types.set(name, descriptor);
  }

  public hasType(name: string): boolean {
    return this.types.has(name);
  }

  /**
   * Convenience: register a JS constructor as a type.
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
      callStaticMethod(name: string, ...args: unknown[]): unknown {
        const method = staticMethods[name];
        if (typeof method === 'function') {
          return method(...args);
        }
        // Try prototype method
        const protoMethod = (constructor.prototype as Record<string, unknown>)[name];
        if (typeof protoMethod === 'function') {
          return (protoMethod as (...a: unknown[]) => unknown)(...args);
        }
        throw new SpelEvaluationException(-1, SpelMessage.METHOD_NOT_FOUND, name, this.name);
      },
      getStaticField(name: string): unknown {
        if (name in staticFields) return staticFields[name];
        // Try constructor property
        const ctor = constructor as unknown as Record<string, unknown>;
        if (name in ctor) return ctor[name];
        throw new SpelEvaluationException(-1, SpelMessage.PROPERTY_OR_FIELD_NOT_READABLE, name);
      },
    };
    this.types.set(name, descriptor);
  }
}
