import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelEvaluationException } from '../../error/spel-evaluation-exception.js';
import { SpelMessage } from '../../error/spel-message.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class OpMatches extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_MATCHES, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const left = String(this.children[0]!.getValue(state).getValue());
    const pattern = String(this.children[1]!.getValue(state).getValue());

    try {
      const regex = new RegExp(pattern);
      return new TypedValue(regex.test(left));
    } catch {
      throw new SpelEvaluationException(
        this.startPos,
        SpelMessage.MATCHES_REGEX_FAILED,
        left,
        pattern,
      );
    }
  }
}
