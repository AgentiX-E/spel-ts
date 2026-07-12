import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class OpAnd extends Operator {
  constructor(operatorName: string, startPos: number, endPos: number, ...operands: import('../spel-node.js').SpelNodeImpl[]) {
    super(NodeType.OP_AND, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const leftVal = this.children[0]!.getValue(state).getValue();
    // Falsy: false, 0, null, undefined, '', NaN
    if (!leftVal) {
      return new TypedValue(leftVal);
    }
    const rightVal = this.children[1]!.getValue(state).getValue();
    return new TypedValue(rightVal);
  }
}
