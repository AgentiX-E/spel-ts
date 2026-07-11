import type { EvaluationContext } from './evaluation-context.js';
import type { TypedValue } from '../typed-value.js';

/**
 * Parallels Spring MethodResolver
 *
 * Method resolver interface for finding and invoking methods on target objects.
 * Multiple MethodResolvers form a chain of responsibility.
 */
export interface MethodResolver {
  /**
   * Resolve and invoke the specified method on the target object within the current context.
   *
   * @returns TypedValue result, or null if this resolver cannot handle
   */
  resolve(
    context: EvaluationContext,
    target: unknown,
    name: string,
    args: unknown[],
  ): TypedValue | null;
}
