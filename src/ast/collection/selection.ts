import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';

export class Selection extends SpelNodeImpl {
  private readonly nullSafe: boolean;

  constructor(startPos: number, endPos: number, nullSafe: boolean,
    target: SpelNodeImpl, predicate: SpelNodeImpl) {
    super(startPos, endPos, target, predicate);
    this.nullSafe = nullSafe;
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const targetValue = this.children[0]!.getValue(state).getValue();

    if (targetValue === null || targetValue === undefined) {
      if (this.nullSafe) return TypedValue.NULL;
      return new TypedValue([]);
    }

    const collection = this.toCollection(targetValue);
    const result: unknown[] = [];
    for (const item of collection) {
      state.pushHeadIndex(new TypedValue(item));
      try {
        const match = this.children[1]!.getValue(state).getValue();
        if (match) {
          result.push(item);
        }
      } finally {
        state.popHeadIndex();
      }
    }
    return new TypedValue(result);
  }

  private toCollection(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (value instanceof Set) return [...value];
    if (value instanceof Map) return [...value.values()];
    return [value];
  }

  public toStringAST(): string {
    return `${this.children[0]!.toStringAST()}.?[${this.children[1]!.toStringAST()}]`;
  }
}
