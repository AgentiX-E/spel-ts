import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class VariableReference extends SpelNodeImpl {
  private readonly variableName: string;

  constructor(startPos: number, endPos: number, variableName: string) {
    super(NodeType.VARIABLE_REFERENCE, startPos, endPos);
    this.variableName = variableName;
  }

  /** Get the variable name (without # prefix) */
  public getVariableName(): string {
    return this.variableName;
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    return state.lookupVariable(this.variableName);
  }

  public toStringAST(): string {
    return '#' + this.variableName;
  }
}
