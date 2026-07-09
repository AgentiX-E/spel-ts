import type { EvaluationContext } from './evaluation-context.js';
import { TypedValue } from '../typed-value.js';
import type { PropertyAccessor } from './property-accessor.js';

export class ArrayAccessor implements PropertyAccessor {
  public getSpecificTargetClasses(): null { return null; }

  public canRead(_context: EvaluationContext, target: unknown, name: string): boolean {
    if (!Array.isArray(target)) return false;
    const index = parseInt(name, 10);
    return !isNaN(index) && index >= 0 && index < (target as unknown[]).length;
  }

  public read(_context: EvaluationContext, target: unknown, name: string): TypedValue {
    const arr = target as unknown[];
    const index = parseInt(name, 10);
    return new TypedValue(arr[index]);
  }

  public canWrite(_context: EvaluationContext, target: unknown, _name: string): boolean {
    return Array.isArray(target);
  }

  public write(_context: EvaluationContext, target: unknown, name: string, newValue: unknown): void {
    const arr = target as unknown[];
    const index = parseInt(name, 10);
    arr[index] = newValue;
  }
}
