import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class OpBetween extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_BETWEEN, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const value = this.children[0]!.getValue(state).getValue() as number;
    const lowerBound = this.children[1]!.getValue(state).getValue() as number;
    const upperBound = this.children[2]!.getValue(state).getValue() as number;

    return new TypedValue(lowerBound <= value && value <= upperBound);
  }

  /**
   * Ternary rendering. The inherited implementation assumes two operands and
   * dropped the upper bound entirely, rendering `(1 between 5)` for
   * `1 between {1, 5}`.
   */
  public override toStringAST(): string {
    const value = this.children[0]!.toStringAST();
    const lower = this.children[1]!.toStringAST();
    const upper = this.children[2]!.toStringAST();
    return `(${value} between {${lower}, ${upper}})`;
  }
}
