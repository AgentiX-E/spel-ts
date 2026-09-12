import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { add, numericOperand } from '../../type/numeric.js';

/**
 * Addition, or concatenation when either operand is a String.
 */
export class OpPlus extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_PLUS, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const leftValue = this.children[0]!.getValue(state);
    const rightValue = this.children[1]!.getValue(state);
    const left = leftValue.getValue();
    const right = rightValue.getValue();

    // A String operand promotes the whole expression to concatenation, as in
    // Java, so this takes precedence over numeric addition.
    if (typeof left === 'string' || typeof right === 'string') {
      return new TypedValue(String(left) + String(right));
    }

    const sum = add(
      numericOperand(left, leftValue.getNumericKind(), this.startPos),
      numericOperand(right, rightValue.getNumericKind(), this.startPos),
    );
    return new TypedValue(sum.value, null, sum.kind);
  }
}
