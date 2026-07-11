import type { TypeDescriptor } from './type-descriptor.js';

/**
 * Type locator, parallels Spring TypeLocator
 *
 * Used to resolve type names in T(java.lang.String).
 * Pure Registry pattern — no globalThis/window fallback.
 */
export interface TypeLocator {
  /**
   * Find type
   * @throws SpelEvaluationException if type is not registered
   */
  findType(typeName: string): TypeDescriptor;

  /**
   * Register type
   */
  registerType(name: string, descriptor: TypeDescriptor): void;

  /**
   * Check if type is registered
   */
  hasType(name: string): boolean;
}
