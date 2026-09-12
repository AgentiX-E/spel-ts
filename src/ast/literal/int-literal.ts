import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Literal } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { integerLiteralKind, type NumericKind } from '../../type/numeric.js';

export class IntLiteral extends Literal {
  private readonly value: number | bigint;
  private readonly kind: NumericKind;

  constructor(startPos: number, endPos: number, value: number | bigint) {
    super(NodeType.INT_LITERAL, startPos, endPos, String(value));
    this.value = typeof value === 'bigint' ? value : Math.trunc(value);
    // A literal that does not fit in an `int` is a `long` in Java, and one that
    // does not fit a JavaScript number exactly stays a bigint.
    this.kind = integerLiteralKind(this.value);
  }

  /** Get the parsed integer value */
  public getParsedValue(): number | bigint {
    return this.value;
  }

  public getValueInternal(_state: ExpressionState): TypedValue {
    return new TypedValue(this.value, null, this.kind);
  }

  public toStringAST(): string {
    return String(this.value);
  }
}
