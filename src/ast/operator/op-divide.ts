import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { divide, numericOperand } from '../../type/numeric.js';

/**
 * Division. Integral operands truncate toward zero and reject a zero divisor;
 * floating operands follow IEEE-754 and yield Infinity or NaN.
 */
export class OpDivide extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_DIVIDE, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const leftValue = this.children[0]!.getValue(state);
    const rightValue = this.children[1]!.getValue(state);
    const quotient = divide(
      numericOperand(leftValue.getValue(), leftValue.getNumericKind(), this.startPos),
      numericOperand(rightValue.getValue(), rightValue.getNumericKind(), this.startPos),
      this.startPos,
    );
    return new TypedValue(quotient.value, null, quotient.kind);
  }
}
