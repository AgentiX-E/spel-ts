/**
 * 类型描述符，对标 Spring TypeDescriptor
 */
export interface TypeDescriptor {
  /** 类型名称 (如 'java.lang.String') */
  readonly name: string;

  /** JS 构造函数 */
  readonly constructor: new (...args: unknown[]) => unknown;

  /** 静态方法 */
  readonly staticMethods: Record<string, (...args: unknown[]) => unknown>;

  /** 静态字段 */
  readonly staticFields: Record<string, unknown>;

  /** 类型检查 */
  isInstance(value: unknown): boolean;

  /** 创建实例 */
  newInstance(...args: unknown[]): unknown;

  /** 调用静态方法 */
  callStaticMethod(name: string, ...args: unknown[]): unknown;

  /** 获取静态字段 */
  getStaticField(name: string): unknown;
}
