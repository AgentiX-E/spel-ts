import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';

export class OpPlus extends Operator {
  constructor(operatorName: string, startPos: number, endPos: number, ...operands: import('../spel-node.js').SpelNodeImpl[]) {
    super(operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const left = this.children[0]!.getValue(state);
    const right = this.children[1]!.getValue(state);

    const leftVal = left.getValue();
    const rightVal = right.getValue();

    // String concatenation: if either operand is a string, convert both to string
    if (typeof leftVal === 'string' || typeof rightVal === 'string') {
      return new TypedValue(String(leftVal) + String(rightVal));
    }

    // Number addition
    return new TypedValue((leftVal as number) + (rightVal as number));
  }
}
