import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

/** Selection mode: controls which matching elements are returned */
export const enum SelectMode {
  /** .?[predicate] — return all matching elements */
  ALL = 'all',
  /** .^[predicate] or .$[predicate] — return first matching element */
  FIRST = 'first',
  /** .*[predicate] — return last matching element */
  LAST = 'last',
}

export class Selection extends SpelNodeImpl {
  private readonly nullSafe: boolean;
  private readonly mode: SelectMode;

  constructor(
    startPos: number,
    endPos: number,
    nullSafe: boolean,
    target: SpelNodeImpl,
    predicate: SpelNodeImpl,
    mode: SelectMode = SelectMode.ALL,
  ) {
    super(NodeType.SELECTION, startPos, endPos, target, predicate);
    this.nullSafe = nullSafe;
    this.mode = mode;
  }

  public getSelectMode(): SelectMode {
    return this.mode;
  }

  public isNullSafe(): boolean {
    return this.nullSafe;
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const targetValue = this.children[0]!.getValue(state).getValue();

    if (targetValue === null || targetValue === undefined) {
      if (this.nullSafe) return TypedValue.NULL;
      if (this.mode === SelectMode.ALL) return new TypedValue([]);
      return TypedValue.NULL;
    }

    const collection = this.toCollection(targetValue);

    if (this.mode === SelectMode.FIRST) {
      for (const item of collection) {
        state.pushHeadIndex(new TypedValue(item));
        try {
          const match = this.children[1]!.getValue(state).getValue();
          if (match) {
            return new TypedValue(item);
          }
        } finally {
          state.popHeadIndex();
        }
      }
      return TypedValue.NULL;
    }

    if (this.mode === SelectMode.LAST) {
      let lastMatch: unknown = null;
      let found = false;
      for (const item of collection) {
        state.pushHeadIndex(new TypedValue(item));
        try {
          const match = this.children[1]!.getValue(state).getValue();
          if (match) {
            lastMatch = item;
            found = true;
          }
        } finally {
          state.popHeadIndex();
        }
      }
      return found ? new TypedValue(lastMatch) : TypedValue.NULL;
    }

    // SelectMode.ALL
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
    const prefix =
      this.mode === SelectMode.FIRST ? '.^[' : this.mode === SelectMode.LAST ? '.*[' : '.?[';
    return `${this.children[0]!.toStringAST()}${prefix}${this.children[1]!.toStringAST()}]`;
  }
}
