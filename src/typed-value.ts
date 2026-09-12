/**
 * Parallels Spring TypedValue
 *
 * Wraps evaluation result with type descriptor; core data carrier in the evaluation pipeline.
 */
import type { NumericKind } from './type/numeric.js';

export class TypedValue {
  private readonly value: unknown;
  private readonly typeDescriptor: unknown;
  private readonly numericKind: NumericKind | undefined;

  constructor(value: unknown, typeDescriptor?: unknown, numericKind?: NumericKind) {
    this.value = value;
    this.typeDescriptor = typeDescriptor ?? null;
    this.numericKind = numericKind;
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
   * The Java numeric kind of this value, when it is numeric.
   *
   * JavaScript numbers carry no such distinction, so the kind has to travel
   * with the value: it is what lets `8 / 5` evaluate to `1` rather than `1.6`.
   * Values that did not originate from a numeric literal or a numeric operator
   * report `undefined`, and callers fall back to {@link inferKind}.
   */
  public getNumericKind(): NumericKind | undefined {
    return this.numericKind;
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
