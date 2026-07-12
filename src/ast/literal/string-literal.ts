import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Literal } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class StringLiteral extends Literal {
  private readonly value: string;

  constructor(startPos: number, endPos: number, value: string) {
    super(NodeType.STRING_LITERAL, startPos, endPos, "'" + value + "'");
    this.value = value;
  }

  /** Get the parsed string value (without surrounding quotes) */
  public getParsedValue(): string {
    return this.value;
  }

  public getValueInternal(_state: ExpressionState): TypedValue {
    return new TypedValue(this.value);
  }

  public toStringAST(): string {
    return "'" + this.value + "'";
  }
}
