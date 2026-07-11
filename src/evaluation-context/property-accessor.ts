import type { EvaluationContext } from './evaluation-context.js';
import type { TypedValue } from '../typed-value.js';

/**
 * Parallels Spring PropertyAccessor
 *
 * Property accessor interface for reading/writing target object properties.
 * Multiple Accessors form a chain of responsibility, tried in registration order.
 */
export interface PropertyAccessor {
  /**
   * Return target types this Accessor can handle.
   * Return null for generic handling.
   */
  getSpecificTargetClasses(): (new (...args: unknown[]) => unknown)[] | null;

  /**
   * Whether the specified property can be read from the target object
   */
  canRead(context: EvaluationContext, target: unknown, name: string): boolean;

  /**
   * Read property value
   */
  read(context: EvaluationContext, target: unknown, name: string): TypedValue;

  /**
   * Whether it can be written
   */
  canWrite(context: EvaluationContext, target: unknown, name: string): boolean;

  /**
   * Write property value
   */
  write(context: EvaluationContext, target: unknown, name: string, newValue: unknown): void;
}
