import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';

export class InlineList extends SpelNodeImpl {
  constructor(startPos: number, endPos: number, ...elements: SpelNodeImpl[]) {
    super(startPos, endPos, ...elements);
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const result: unknown[] = [];
    for (const child of this.children) {
      result.push(child.getValue(state).getValue());
    }
    return new TypedValue(result);
  }

  public toStringAST(): string {
    return '{' + this.children.map(c => c.toStringAST()).join(', ') + '}';
  }
}
