import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

/**
 * Range operator `..` — parallels Spring OpRange
 *
 * a..b generates an integer sequence from a to b (inclusive)
 */
export class RangeOperator extends SpelNodeImpl {
  constructor(startPos: number, endPos: number, left: SpelNodeImpl, right: SpelNodeImpl) {
    super(NodeType.RANGE_OPERATOR, startPos, endPos, left, right);
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const start = Number(this.children[0]!.getValue(state).getValue());
    const end = Number(this.children[1]!.getValue(state).getValue());

    const result: number[] = [];
    if (start <= end) {
      for (let i = start; i <= end; i++) {
        result.push(i);
      }
    } else {
      for (let i = start; i >= end; i--) {
        result.push(i);
      }
    }
    return new TypedValue(result);
  }

  public toStringAST(): string {
    return `(${this.children[0]!.toStringAST()}..${this.children[1]!.toStringAST()})`;
  }
}
