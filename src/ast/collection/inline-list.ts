import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class InlineList extends SpelNodeImpl {
  constructor(startPos: number, endPos: number, ...elements: SpelNodeImpl[]) {
    super(NodeType.INLINE_LIST, startPos, endPos, ...elements);
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
