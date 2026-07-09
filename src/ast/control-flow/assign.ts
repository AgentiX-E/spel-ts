import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';

export class Assign extends SpelNodeImpl {
  constructor(startPos: number, endPos: number, target: SpelNodeImpl, value: SpelNodeImpl) {
    super(startPos, endPos, target, value);
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const value = this.children[1]!.getValue(state).getValue();
    this.children[0]!.setValue(state, value);
    return new TypedValue(value);
  }

  public toStringAST(): string {
    return `(${this.children[0]!.toStringAST()} = ${this.children[1]!.toStringAST()})`;
  }
}
