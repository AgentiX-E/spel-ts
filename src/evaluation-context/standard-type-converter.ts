import { SpelTypeConverter } from '../bridge/type-coercion.js';

/**
 * Enhanced type converter — adds numeric coercion for arithmetic operators.
 */
export class StandardTypeConverter extends SpelTypeConverter {
  /**
   * Coerce value to a number for arithmetic operations.
   * null/undefined → 0 (as per SpEL semantics)
   */
  public coerceToNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  /**
   * Check if a value is "truthy" in SpEL semantics.
   */
  public isTruthy(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    return true;
  }
}
