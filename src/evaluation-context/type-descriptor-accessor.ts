import type { EvaluationContext } from './evaluation-context.js';
import type { PropertyAccessor } from './property-accessor.js';
import { TypedValue } from '../typed-value.js';
import type { TypeDescriptor } from '../type/type-descriptor.js';

/**
 * TypeDescriptor 属性访问器
 *
 * 处理 T(Type).staticMethod 和 T(Type).staticField 访问，
 * 将 PropertyAccessor 链扩展到 TypeDescriptor 对象。
 */
export class TypeDescriptorAccessor implements PropertyAccessor {
  public getSpecificTargetClasses(): null {
    return null;
  }

  public canRead(_context: EvaluationContext, target: unknown, _name: string): boolean {
    if (target === null || target === undefined) return false;
    // TypeDescriptor objects have name, constructor, staticMethods, staticFields
    return typeof target === 'object'
      && 'name' in target
      && 'constructor' in target
      && 'staticMethods' in target
      && 'staticFields' in target;
  }

  public read(_context: EvaluationContext, target: unknown, name: string): TypedValue {
    const td = target as TypeDescriptor;

    // Static method: call it
    if (typeof td.staticMethods[name] === 'function') {
      // Return the method itself — caller will invoke with args
      return new TypedValue(td.staticMethods[name]);
    }

    // Static field: return value
    if (name in td.staticFields) {
      return new TypedValue(td.staticFields[name]);
    }

    // Check constructor-level static property
    const ctor = td.constructor as unknown as Record<string, unknown>;
    if (typeof ctor[name] === 'function') {
      return new TypedValue(ctor[name]);
    }
    if (name in ctor) {
      return new TypedValue(ctor[name]);
    }

    return TypedValue.NULL;
  }

  public canWrite(_context: EvaluationContext, target: unknown, _name: string): boolean {
    return typeof target === 'object' && target !== null && 'staticFields' in target;
  }

  public write(_context: EvaluationContext, target: unknown, name: string, newValue: unknown): void {
    const td = target as TypeDescriptor;
    td.staticFields[name] = newValue;
  }
}
