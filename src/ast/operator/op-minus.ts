import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { negate, numericOperand, subtract } from '../../type/numeric.js';

/**
 * Subtraction, and unary negation when the parser supplies a single operand.
 */
export class OpMinus extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_MINUS, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    // A prefix `-` carries one operand. The parser emits that shape directly
    // rather than inventing a placeholder left operand, which previously made
    // this node ambiguous with a genuine `null - x`.
    if (this.children.length === 1) {
      const operand = this.children[0]!.getValue(state);
      const negated = negate(
        numericOperand(operand.getValue(), operand.getNumericKind(), this.startPos),
      );
      return new TypedValue(negated.value, null, negated.kind);
    }

    const leftValue = this.children[0]!.getValue(state);
    const rightValue = this.children[1]!.getValue(state);
    const difference = subtract(
      numericOperand(leftValue.getValue(), leftValue.getNumericKind(), this.startPos),
      numericOperand(rightValue.getValue(), rightValue.getNumericKind(), this.startPos),
    );
    return new TypedValue(difference.value, null, difference.kind);
  }

  public override toStringAST(): string {
    if (this.children.length === 1) {
      return `(-${this.children[0]?.toStringAST() ?? ''})`;
    }
    return super.toStringAST();
  }
}
