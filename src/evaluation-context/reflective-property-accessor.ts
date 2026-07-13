import type { EvaluationContext } from './evaluation-context.js';
import { TypedValue } from '../typed-value.js';
import type { PropertyAccessor } from './property-accessor.js';
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';

export class ReflectivePropertyAccessor implements PropertyAccessor {
  public getSpecificTargetClasses(): null {
    return null; // Generic handling
  }

  public canRead(_context: EvaluationContext, target: unknown, name: string): boolean {
    if (target === null || target === undefined) return false;
    if (typeof target !== 'object' && typeof target !== 'function') return false;
    return name in Object(target);
  }

  public read(_context: EvaluationContext, target: unknown, name: string): TypedValue {
    if (target === null || target === undefined) {
      throw new SpelEvaluationException(
        -1,
        SpelMessage.PROPERTY_OR_FIELD_NOT_READABLE_ON_NULL,
        name,
      );
    }
    const obj = target as Record<string, unknown>;
    if (!(name in obj)) {
      throw new SpelEvaluationException(-1, SpelMessage.PROPERTY_OR_FIELD_NOT_READABLE, name);
    }
    return new TypedValue(obj[name]);
  }

  public canWrite(_context: EvaluationContext, target: unknown, _name: string): boolean {
    if (target === null || target === undefined) return false;
    return typeof target === 'object';
  }

  public write(
    _context: EvaluationContext,
    target: unknown,
    name: string,
    newValue: unknown,
  ): void {
    if (target === null || target === undefined || typeof target !== 'object') {
      throw new SpelEvaluationException(-1, SpelMessage.PROPERTY_OR_FIELD_NOT_WRITABLE, name);
    }
    (target as Record<string, unknown>)[name] = newValue;
  }
}
