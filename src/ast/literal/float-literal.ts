import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Literal } from '../spel-node.js';

export class FloatLiteral extends Literal {
  private readonly value: number;

  constructor(startPos: number, endPos: number, value: number) {
    super(startPos, endPos, String(value));
    this.value = value;
  }

  public getValueInternal(_state: ExpressionState): TypedValue {
    return new TypedValue(this.value);
  }

  public toStringAST(): string {
    return String(this.value) + 'F';
  }
}
