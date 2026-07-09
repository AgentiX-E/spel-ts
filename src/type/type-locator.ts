import type { TypeDescriptor } from './type-descriptor.js';

/**
 * 类型定位器，对标 Spring TypeLocator
 *
 * 用于解析 T(java.lang.String) 中的类型名称。
 * 纯 Registry 模式 — 不使用 globalThis/window fallback。
 */
export interface TypeLocator {
  /**
   * 查找类型
   * @throws SpelEvaluationException 如果类型未注册
   */
  findType(typeName: string): TypeDescriptor;

  /**
   * 注册类型
   */
  registerType(name: string, descriptor: TypeDescriptor): void;

  /**
   * 检查类型是否已注册
   */
  hasType(name: string): boolean;
}
