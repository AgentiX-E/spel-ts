import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';

export class Elvis extends SpelNodeImpl {
  constructor(startPos: number, endPos: number, left: SpelNodeImpl, right: SpelNodeImpl) {
    super(startPos, endPos, left, right);
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const leftVal = this.children[0]!.getValue(state);
    const raw = leftVal.getValue();
    if (raw !== null && raw !== undefined) {
      return leftVal;
    }
    return this.children[1]!.getValue(state);
  }

  public toStringAST(): string {
    return `(${this.children[0]!.toStringAST()} ?: ${this.children[1]!.toStringAST()})`;
  }
}
