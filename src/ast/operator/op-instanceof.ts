import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';

export class OpInstanceof extends Operator {
  constructor(operatorName: string, startPos: number, endPos: number, ...operands: import('../spel-node.js').SpelNodeImpl[]) {
    super(operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const left = this.children[0]!.getValue(state).getValue();
    const typeName = String(this.children[1]!.getValue(state).getValue());

    // Special case: typeof null === 'object', but 'null' is a valid type check
    if (typeName === 'null') {
      return new TypedValue(left === null);
    }

    return new TypedValue(typeof left === typeName);
  }
}
