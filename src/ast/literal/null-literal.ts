import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Literal } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class NullLiteral extends Literal {
  constructor(startPos: number, endPos: number) {
    super(NodeType.NULL_LITERAL, startPos, endPos, 'null');
  }

  public getValueInternal(_state: ExpressionState): TypedValue {
    return TypedValue.NULL;
  }

  public toStringAST(): string {
    return 'null';
  }
}
