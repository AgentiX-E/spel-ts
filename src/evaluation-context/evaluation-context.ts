import type { TypedValue } from '../typed-value.js';
import type { PropertyAccessor } from './property-accessor.js';
import type { MethodResolver } from './method-resolver.js';
import type { TypeLocator } from '../type/type-locator.js';
import type { BeanResolver } from '../bean/bean-resolver.js';
import type { SpelTypeConverter } from '../bridge/type-coercion.js';

/**
 * 对标 Spring EvaluationContext
 *
 * 表达式求值的全局上下文，管理变量、函数、类型定位器、Bean 解析器等。
 */
export interface EvaluationContext {
  /**
   * 获取根对象
   */
  getRootObject(): TypedValue;

  /**
   * 设置根对象
   */
  setRootObject(obj: unknown): void;

  /**
   * 查找变量。返回 null 表示未找到。
   */
  lookupVariable(name: string): TypedValue | null;

  /**
   * 设置变量
   */
  setVariable(name: string, value: unknown): void;

  /**
   * 查找函数。返回 null 表示未找到。
   */
  lookupFunction(name: string): ((...args: unknown[]) => unknown) | null;

  /**
   * 注册函数
   */
  registerFunction(name: string, fn: (...args: unknown[]) => unknown): void;

  /**
   * 获取 PropertyAccessor 链
   */
  getPropertyAccessors(): PropertyAccessor[];

  /**
   * 添加 PropertyAccessor
   */
  addPropertyAccessor(accessor: PropertyAccessor): void;

  /**
   * 获取 MethodResolver 链
   */
  getMethodResolvers(): MethodResolver[];

  /**
   * 添加 MethodResolver
   */
  addMethodResolver(resolver: MethodResolver): void;

  /**
   * 获取 TypeLocator
   */
  getTypeLocator(): TypeLocator;

  /**
   * 设置 TypeLocator
   */
  setTypeLocator(typeLocator: TypeLocator): void;

  /**
   * 获取 BeanResolver
   */
  getBeanResolver(): BeanResolver;

  /**
   * 设置 BeanResolver
   */
  setBeanResolver(beanResolver: BeanResolver): void;

  /**
   * 获取 TypeConverter
   */
  getTypeConverter(): SpelTypeConverter;

  /**
   * 创建子上下文（用于属性链导航）
   */
  createChildContext(rootObject: unknown): EvaluationContext;
}
