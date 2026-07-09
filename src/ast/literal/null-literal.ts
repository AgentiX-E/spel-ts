import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Literal } from '../spel-node.js';

export class NullLiteral extends Literal {
  constructor(startPos: number, endPos: number) {
    super(startPos, endPos, 'null');
  }

  public getValueInternal(_state: ExpressionState): TypedValue {
    return TypedValue.NULL;
  }

  public toStringAST(): string {
    return 'null';
  }
}
