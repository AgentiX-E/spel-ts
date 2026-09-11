import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { multiply, numericOperand } from '../../type/numeric.js';

/**
 * Multiplication under binary numeric promotion.
 */
export class OpMultiply extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_MULTIPLY, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const leftValue = this.children[0]!.getValue(state);
    const rightValue = this.children[1]!.getValue(state);
    const product = multiply(
      numericOperand(leftValue.getValue(), leftValue.getNumericKind(), this.startPos),
      numericOperand(rightValue.getValue(), rightValue.getNumericKind(), this.startPos),
    );
    return new TypedValue(product.value, null, product.kind);
  }
}
