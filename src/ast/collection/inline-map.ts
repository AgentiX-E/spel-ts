import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class InlineMap extends SpelNodeImpl {
  constructor(startPos: number, endPos: number, ...entries: SpelNodeImpl[]) {
    // Entries come in pairs: [key0, value0, key1, value1, ...]
    super(NodeType.INLINE_MAP, startPos, endPos, ...entries);
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const result = new Map<string, unknown>();
    for (let i = 0; i < this.children.length; i += 2) {
      const key = String(this.children[i]!.getValue(state).getValue());
      const value = this.children[i + 1]!.getValue(state).getValue();
      result.set(key, value);
    }
    return new TypedValue(result);
  }

  public toStringAST(): string {
    const parts: string[] = [];
    for (let i = 0; i < this.children.length; i += 2) {
      parts.push(`${this.children[i]!.toStringAST()} : ${this.children[i + 1]!.toStringAST()}`);
    }
    return '{' + parts.join(', ') + '}';
  }
}
