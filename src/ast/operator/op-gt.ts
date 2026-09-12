import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';
import { compareNumericValues } from '../../type/numeric.js';

export class OpGT extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_GT, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const left = this.children[0]!.getValue(state).getValue();
    const right = this.children[1]!.getValue(state).getValue();

    // Both strings: string comparison
    if (typeof left === 'string' && typeof right === 'string') {
      return new TypedValue(left.localeCompare(right) > 0);
    }

    // Both numbers: numeric comparison
    if (typeof left === 'number' && typeof right === 'number') {
      return new TypedValue(left > right);
    }

    // A BigInt compares numerically and exactly; without this `10n > 5` was
    // false, because the comparison fell through to the string branch below.
    const numeric = compareNumericValues(left, right);
    if (numeric !== undefined) {
      return new TypedValue(numeric > 0);
    }

    // Default: convert both to strings and compare
    return new TypedValue(String(left) > String(right));
  }
}
