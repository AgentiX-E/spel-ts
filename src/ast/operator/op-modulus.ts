import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class OpModulus extends Operator {
  constructor(operatorName: string, startPos: number, endPos: number, ...operands: import('../spel-node.js').SpelNodeImpl[]) {
    super(NodeType.OP_MODULUS, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const left = this.children[0]!.getValue(state).getValue() as number;
    const right = this.children[1]!.getValue(state).getValue() as number;
    return new TypedValue(left % right);
  }
}
