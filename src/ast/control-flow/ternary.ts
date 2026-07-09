import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';

export class Ternary extends SpelNodeImpl {
  constructor(startPos: number, endPos: number,
    condition: SpelNodeImpl, trueExpr: SpelNodeImpl, falseExpr: SpelNodeImpl) {
    super(startPos, endPos, condition, trueExpr, falseExpr);
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const conditionVal = this.children[0]!.getValue(state).getValue();
    if (conditionVal) {
      return this.children[1]!.getValue(state);
    } else {
      return this.children[2]!.getValue(state);
    }
  }

  public toStringAST(): string {
    return `(${this.children[0]!.toStringAST()} ? ${this.children[1]!.toStringAST()} : ${this.children[2]!.toStringAST()})`;
  }
}
