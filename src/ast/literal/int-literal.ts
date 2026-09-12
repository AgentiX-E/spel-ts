import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Literal } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { integerLiteralKind, type NumericKind } from '../../type/numeric.js';

export class IntLiteral extends Literal {
  private readonly value: number;
  private readonly kind: NumericKind;

  constructor(startPos: number, endPos: number, value: number) {
    super(NodeType.INT_LITERAL, startPos, endPos, String(value));
    this.value = Math.trunc(value);
    // A literal that does not fit in an `int` is a `long` in Java.
    this.kind = integerLiteralKind(this.value);
  }

  /** Get the parsed integer value */
  public getParsedValue(): number {
    return this.value;
  }

  public getValueInternal(_state: ExpressionState): TypedValue {
    return new TypedValue(this.value, null, this.kind);
  }

  public toStringAST(): string {
    return String(this.value);
  }
}
