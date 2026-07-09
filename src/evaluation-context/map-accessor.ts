import type { EvaluationContext } from './evaluation-context.js';
import { TypedValue } from '../typed-value.js';
import type { PropertyAccessor } from './property-accessor.js';

export class MapAccessor implements PropertyAccessor {
  public getSpecificTargetClasses(): null { return null; }

  public canRead(_context: EvaluationContext, target: unknown, _name: string): boolean {
    if (target === null || target === undefined) return false;
    return target instanceof Map;
  }

  public read(_context: EvaluationContext, target: unknown, name: string): TypedValue {
    const map = target as Map<string, unknown>;
    if (!map.has(name)) {
      return TypedValue.NULL;
    }
    return new TypedValue(map.get(name));
  }

  public canWrite(_context: EvaluationContext, target: unknown, _name: string): boolean {
    return target instanceof Map;
  }

  public write(_context: EvaluationContext, target: unknown, name: string, newValue: unknown): void {
    (target as Map<string, unknown>).set(name, newValue);
  }
}
