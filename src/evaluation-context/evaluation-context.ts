import type { TypedValue } from '../typed-value.js';
import type { PropertyAccessor } from './property-accessor.js';
import type { MethodResolver } from './method-resolver.js';
import type { TypeLocator } from '../type/type-locator.js';
import type { BeanResolver } from '../bean/bean-resolver.js';
import type { SpelTypeConverter } from '../bridge/type-coercion.js';

/**
 * Parallels Spring EvaluationContext
 *
 * Global evaluation context: manages variables, functions, type locator, bean resolver, etc.
 */
export interface EvaluationContext {
  /**
   * Get root object
   */
  getRootObject(): TypedValue;

  /**
   * Set root object
   */
  setRootObject(obj: unknown): void;

  /**
   * Lookup variable. Returns null if not found.
   */
  lookupVariable(name: string): TypedValue | null;

  /**
   * Set variable
   */
  setVariable(name: string, value: unknown): void;

  /**
   * Lookup function. Returns null if not found.
   */
  lookupFunction(name: string): ((...args: unknown[]) => unknown) | null;

  /**
   * Register function
   */
  registerFunction(name: string, fn: (...args: unknown[]) => unknown): void;

  /**
   * Get PropertyAccessor chain
   */
  getPropertyAccessors(): PropertyAccessor[];

  /**
   * Add PropertyAccessor
   */
  addPropertyAccessor(accessor: PropertyAccessor): void;

  /**
   * Get MethodResolver chain
   */
  getMethodResolvers(): MethodResolver[];

  /**
   * Add MethodResolver
   */
  addMethodResolver(resolver: MethodResolver): void;

  /**
   * Get TypeLocator
   */
  getTypeLocator(): TypeLocator;

  /**
   * Set TypeLocator
   */
  setTypeLocator(typeLocator: TypeLocator): void;

  /**
   * Get BeanResolver
   */
  getBeanResolver(): BeanResolver;

  /**
   * Set BeanResolver
   */
  setBeanResolver(beanResolver: BeanResolver): void;

  /**
   * Get TypeConverter
   */
  getTypeConverter(): SpelTypeConverter;

  /**
   * Create child context (for property chain navigation)
   */
  createChildContext(rootObject: unknown): EvaluationContext;
}
