import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';

export class ConstructorReference extends SpelNodeImpl {
  private readonly className: string;

  constructor(startPos: number, endPos: number, className: string, ...args: SpelNodeImpl[]) {
    super(startPos, endPos, ...args);
    this.className = className;
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const argValues = this.children.map(c => c.getValue(state).getValue());
    const typeDesc = state.findType(this.className);
    return new TypedValue(typeDesc.newInstance(...argValues));
  }

  public toStringAST(): string {
    return `new ${this.className}(${this.children.map(c => c.toStringAST()).join(', ')})`;
  }
}
