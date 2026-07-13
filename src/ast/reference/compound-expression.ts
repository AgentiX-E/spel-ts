import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class CompoundExpression extends SpelNodeImpl {
  constructor(startPos: number, endPos: number, ...children: SpelNodeImpl[]) {
    super(NodeType.COMPOUND_EXPRESSION, startPos, endPos, ...children);
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    let result: TypedValue = TypedValue.NULL;
    for (let i = 0; i < this.children.length; i++) {
      const childState = i === 0 ? state : state.createChildState(result.getValue());
      result = this.children[i]!.getValue(childState);
    }
    return result;
  }

  public toStringAST(): string {
    return this.children.map((c) => c.toStringAST()).join('.');
  }
}
