import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { equalityCheck } from './equality.js';

/**
 * Equality, following Spring equality rules rather than JavaScript coercion.
 */
export class OpEQ extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_EQ, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const left = this.children[0]!.getValue(state).getValue();
    const right = this.children[1]!.getValue(state).getValue();
    return new TypedValue(equalityCheck(left, right));
  }
}
