import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { requireBoolean } from './operand-guards.js';

/**
 * Logical disjunction. Both operands must be Boolean, and the right operand
 * is not evaluated when the left is true.
 */
export class OpOr extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_OR, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    if (requireBoolean(this.children[0]!, state)) {
      return new TypedValue(true);
    }
    return new TypedValue(requireBoolean(this.children[1]!, state));
  }
}
