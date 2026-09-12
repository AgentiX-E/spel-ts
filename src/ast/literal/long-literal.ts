import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Literal } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { integerLiteralKind, type NumericKind } from '../../type/numeric.js';

export class LongLiteral extends Literal {
  private readonly value: number | bigint;
  private readonly kind: NumericKind;

  constructor(startPos: number, endPos: number, value: number | bigint) {
    super(NodeType.LONG_LITERAL, startPos, endPos, String(value) + 'L');
    this.value = value;
    // A long literal beyond the range a JavaScript number holds exactly is kept
    // as a bigint, so `9007199254740993L` no longer rounds to its neighbour.
    this.kind = integerLiteralKind(this.value);
  }

  public getParsedValue(): number | bigint {
    return this.value;
  }

  public getValueInternal(_state: ExpressionState): TypedValue {
    return new TypedValue(this.value, null, this.kind);
  }

  public toStringAST(): string {
    return String(this.value) + 'L';
  }
}
