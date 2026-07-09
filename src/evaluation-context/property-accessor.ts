import type { EvaluationContext } from './evaluation-context.js';
import type { TypedValue } from '../typed-value.js';

/**
 * 对标 Spring PropertyAccessor
 *
 * 属性访问器接口，用于读取/写入目标对象的属性。
 * 多个 Accessor 构成责任链，按注册顺序尝试。
 */
export interface PropertyAccessor {
  /**
   * 返回此 Accessor 可以处理的目标类型。
   * 返回 null 表示通用处理。
   */
  getSpecificTargetClasses(): (new (...args: unknown[]) => unknown)[] | null;

  /**
   * 是否可读取指定目标对象的指定属性
   */
  canRead(context: EvaluationContext, target: unknown, name: string): boolean;

  /**
   * 读取属性值
   */
  read(context: EvaluationContext, target: unknown, name: string): TypedValue;

  /**
   * 是否可写入
   */
  canWrite(context: EvaluationContext, target: unknown, name: string): boolean;

  /**
   * 写入属性值
   */
  write(context: EvaluationContext, target: unknown, name: string, newValue: unknown): void;
}
