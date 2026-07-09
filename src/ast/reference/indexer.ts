import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';
import { SpelEvaluationException } from '../../error/spel-evaluation-exception.js';
import { SpelMessage } from '../../error/spel-message.js';

export class Indexer extends SpelNodeImpl {
  constructor(startPos: number, endPos: number, target: SpelNodeImpl, index: SpelNodeImpl) {
    super(startPos, endPos, target, index);
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const target = this.children[0]!.getValue(state).getValue();
    const index = this.children[1]!.getValue(state).getValue();

    if (Array.isArray(target)) {
      const idx = Number(index);
      if (isNaN(idx) || idx < 0 || idx >= target.length) {
        throw new SpelEvaluationException(this.startPos, SpelMessage.INDEX_OUT_OF_BOUNDS, String(idx));
      }
      return new TypedValue(target[idx]);
    }

    if (target instanceof Map) {
      return new TypedValue(target.get(index));
    }

    if (typeof target === 'object' && target !== null) {
      return new TypedValue((target as Record<string, unknown>)[String(index)]);
    }

    throw new SpelEvaluationException(this.startPos, SpelMessage.INDEXING_NOT_SUPPORTED_FOR_TYPE, typeof target);
  }

  public override isWritable(_state: ExpressionState): boolean { return true; }

  public override setValue(state: ExpressionState, newValue: unknown): void {
    const target = this.children[0]!.getValue(state).getValue();
    const index = this.children[1]!.getValue(state).getValue();

    if (Array.isArray(target)) {
      const idx = Number(index);
      if (idx >= 0 && idx < target.length) {
        target[idx] = newValue;
      }
      return;
    }

    if (target instanceof Map) {
      target.set(index, newValue);
      return;
    }

    if (typeof target === 'object' && target !== null) {
      (target as Record<string, unknown>)[String(index)] = newValue;
    }
  }

  public toStringAST(): string {
    return `${this.children[0]!.toStringAST()}[${this.children[1]!.toStringAST()}]`;
  }
}
