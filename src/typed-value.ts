/**
 * 对标 Spring TypedValue
 *
 * 封装求值结果的值及其类型描述符，是整个求值管道中的核心数据载体。
 */
export class TypedValue {
  private readonly value: unknown;
  private readonly typeDescriptor: unknown;

  constructor(value: unknown, typeDescriptor?: unknown) {
    this.value = value;
    this.typeDescriptor = typeDescriptor ?? null;
  }

  /**
   * 获取原始值
   */
  public getValue(): unknown {
    return this.value;
  }

  /**
   * 获取类型描述符
   */
  public getTypeDescriptor(): unknown {
    return this.typeDescriptor;
  }

  /**
   * 是否为 null
   */
  public isNull(): boolean {
    return this.value === null || this.value === undefined;
  }

  public toString(): string {
    return String(this.value);
  }

  /**
   * TypedValue.NULL 单例，表示 null 类型值
   */
  public static readonly NULL = new TypedValue(null);
}
