import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Literal } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class IntLiteral extends Literal {
  private readonly value: number;

  constructor(startPos: number, endPos: number, value: number) {
    super(NodeType.INT_LITERAL, startPos, endPos, String(value));
    this.value = Math.trunc(value);
  }

  /** Get the parsed integer value */
  public getParsedValue(): number {
    return this.value;
  }

  public getValueInternal(_state: ExpressionState): TypedValue {
    return new TypedValue(this.value);
  }

  public toStringAST(): string {
    return String(this.value);
  }
}
