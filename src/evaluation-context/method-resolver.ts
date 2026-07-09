import type { EvaluationContext } from './evaluation-context.js';
import type { TypedValue } from '../typed-value.js';

/**
 * 对标 Spring MethodResolver
 *
 * 方法解析器接口，用于在目标对象上查找并调用方法。
 * 多个 MethodResolver 构成责任链，按注册顺序尝试。
 */
export interface MethodResolver {
  /**
   * 在当前上下文中，为目标对象解析并调用指定方法。
   *
   * @returns TypedValue 结果，或 null 表示此 resolver 无法处理
   */
  resolve(
    context: EvaluationContext,
    target: unknown,
    name: string,
    args: unknown[],
  ): TypedValue | null;
}
