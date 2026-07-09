import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';

export class CompoundExpression extends SpelNodeImpl {
  public getValueInternal(state: ExpressionState): TypedValue {
    if (this.children.length === 1) {
      return this.children[0]!.getValue(state);
    }

    let result: TypedValue = TypedValue.NULL;

    for (let i = 0; i < this.children.length; i++) {
      if (i > 0) {
        state.pushHeadIndex(result);
      }

      try {
        if (i === 0) {
          result = this.children[i]!.getValue(state);
        } else {
          result = this.children[i]!.getValue(
            state.createChildState(result.getValue()),
          );
        }
      } finally {
        if (i > 0) {
          state.popHeadIndex();
        }
      }
    }

    return result;
  }

  public toStringAST(): string {
    return this.children.map(c => c.toStringAST()).join('.');
  }
}
