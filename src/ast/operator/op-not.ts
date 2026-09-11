import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { requireBoolean } from './operand-guards.js';

/**
 * Logical negation. The operand must be Boolean.
 */
export class OpNot extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_NOT, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    return new TypedValue(!requireBoolean(this.children[0]!, state));
  }
}
