import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { requireBoolean } from './operand-guards.js';

/**
 * Logical conjunction. Both operands must be Boolean, and the right operand
 * is not evaluated when the left is false.
 */
export class OpAnd extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_AND, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    // The left operand is evaluated and type-checked first, so short-circuiting
    // still happens and a non-boolean left operand is still reported.
    if (!requireBoolean(this.children[0]!, state)) {
      return new TypedValue(false);
    }
    return new TypedValue(requireBoolean(this.children[1]!, state));
  }
}
