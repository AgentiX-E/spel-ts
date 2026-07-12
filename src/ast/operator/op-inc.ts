import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelEvaluationException } from '../../error/spel-evaluation-exception.js';
import { SpelMessage } from '../../error/spel-message.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class OpInc extends Operator {
  constructor(operatorName: string, startPos: number, endPos: number, ...operands: import('../spel-node.js').SpelNodeImpl[]) {
    super(NodeType.OP_INC, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const child = this.children[0]!;
    const current = child.getValue(state).getValue() as number;
    const newValue = current + 1;

    try {
      child.setValue(state, newValue);
    } catch {
      throw new SpelEvaluationException(
        this.startPos,
        SpelMessage.OPERAND_NOT_INCREMENTABLE,
        child.toStringAST(),
      );
    }

    return new TypedValue(newValue);
  }
}
