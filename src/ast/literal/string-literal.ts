import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Literal } from '../spel-node.js';

export class StringLiteral extends Literal {
  private readonly value: string;

  constructor(startPos: number, endPos: number, value: string) {
    super(startPos, endPos, value);
    this.value = value;
  }

  public getValueInternal(_state: ExpressionState): TypedValue {
    return new TypedValue(this.value);
  }

  public toStringAST(): string {
    return "'" + this.value.replace(/'/g, "''") + "'";
  }
}
