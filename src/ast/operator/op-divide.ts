import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelEvaluationException } from '../../error/spel-evaluation-exception.js';
import { SpelMessage } from '../../error/spel-message.js';
import { Operator } from '../spel-node.js';

export class OpDivide extends Operator {
  constructor(operatorName: string, startPos: number, endPos: number, ...operands: import('../spel-node.js').SpelNodeImpl[]) {
    super(operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const left = this.children[0]!.getValue(state).getValue() as number;
    const right = this.children[1]!.getValue(state).getValue() as number;

    if (right === 0) {
      throw new SpelEvaluationException(
        this.startPos,
        SpelMessage.DIVISION_BY_ZERO,
      );
    }

    return new TypedValue(left / right);
  }
}
