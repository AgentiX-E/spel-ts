/**
 * Parallels Spring TypedValue
 *
 * Wraps evaluation result with type descriptor; core data carrier in the evaluation pipeline.
 */
export class TypedValue {
  private readonly value: unknown;
  private readonly typeDescriptor: unknown;

  constructor(value: unknown, typeDescriptor?: unknown) {
    this.value = value;
    this.typeDescriptor = typeDescriptor ?? null;
  }

  /**
   * Get raw value
   */
  public getValue(): unknown {
    return this.value;
  }

  /**
   * Get type descriptor
   */
  public getTypeDescriptor(): unknown {
    return this.typeDescriptor;
  }

  /**
   * Whether is null
   */
  public isNull(): boolean {
    return this.value === null || this.value === undefined;
  }

  public toString(): string {
    return String(this.value);
  }

  /**
   * TypedValue.NULL singleton, represents null-typed value
   */
  public static readonly NULL = new TypedValue(null);
}
