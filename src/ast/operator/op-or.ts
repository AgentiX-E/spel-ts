import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class OpOr extends Operator {
  constructor(operatorName: string, startPos: number, endPos: number, ...operands: import('../spel-node.js').SpelNodeImpl[]) {
    super(NodeType.OP_OR, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const leftVal = this.children[0]!.getValue(state).getValue();
    // Truthy: not falsy
    if (leftVal) {
      return new TypedValue(leftVal);
    }
    const rightVal = this.children[1]!.getValue(state).getValue();
    return new TypedValue(rightVal);
  }
}
