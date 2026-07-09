import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';

export class VariableReference extends SpelNodeImpl {
  private readonly variableName: string;

  constructor(startPos: number, endPos: number, variableName: string) {
    super(startPos, endPos);
    this.variableName = variableName;
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    return state.lookupVariable(this.variableName);
  }

  public toStringAST(): string {
    return '#' + this.variableName;
  }
}
