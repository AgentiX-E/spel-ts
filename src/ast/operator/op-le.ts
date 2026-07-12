import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class OpLE extends Operator {
  constructor(operatorName: string, startPos: number, endPos: number, ...operands: import('../spel-node.js').SpelNodeImpl[]) {
    super(NodeType.OP_LE, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const left = this.children[0]!.getValue(state).getValue();
    const right = this.children[1]!.getValue(state).getValue();

    // Both strings: string comparison
    if (typeof left === 'string' && typeof right === 'string') {
      return new TypedValue(left.localeCompare(right) <= 0);
    }

    // Both numbers: numeric comparison
    if (typeof left === 'number' && typeof right === 'number') {
      return new TypedValue(left <= right);
    }

    // Default: convert both to strings and compare
    return new TypedValue(String(left) <= String(right));
  }
}
