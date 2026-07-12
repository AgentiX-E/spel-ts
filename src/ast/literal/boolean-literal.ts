import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Literal } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class BooleanLiteral extends Literal {
  private readonly value: boolean;

  constructor(startPos: number, endPos: number, value: boolean) {
    super(NodeType.BOOLEAN_LITERAL, startPos, endPos, String(value));
    this.value = value;
  }

  /** Get the parsed boolean value */
  public getParsedValue(): boolean {
    return this.value;
  }

  public getValueInternal(_state: ExpressionState): TypedValue {
    return new TypedValue(this.value);
  }

  public toStringAST(): string {
    return String(this.value);
  }
}
