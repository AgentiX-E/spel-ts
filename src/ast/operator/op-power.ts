import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { numericOperand, power } from '../../type/numeric.js';

/**
 * Exponentiation. `Math.pow` is double precision, so the result is a double.
 */
export class OpPower extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_POWER, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const leftValue = this.children[0]!.getValue(state);
    const rightValue = this.children[1]!.getValue(state);
    const result = power(
      numericOperand(leftValue.getValue(), leftValue.getNumericKind(), this.startPos),
      numericOperand(rightValue.getValue(), rightValue.getNumericKind(), this.startPos),
    );
    return new TypedValue(result.value, null, result.kind);
  }
}
