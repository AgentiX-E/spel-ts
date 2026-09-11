import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { numericOperand, remainder as remainderOf } from '../../type/numeric.js';

/**
 * Remainder. The sign follows the dividend, and a zero divisor is rejected
 * for the integral kinds.
 */
export class OpModulus extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_MODULUS, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const leftValue = this.children[0]!.getValue(state);
    const rightValue = this.children[1]!.getValue(state);
    const remainder = remainderOf(
      numericOperand(leftValue.getValue(), leftValue.getNumericKind(), this.startPos),
      numericOperand(rightValue.getValue(), rightValue.getNumericKind(), this.startPos),
      this.startPos,
    );
    return new TypedValue(remainder.value, null, remainder.kind);
  }
}
