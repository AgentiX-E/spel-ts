import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';
import { SpelEvaluationException } from '../../error/spel-evaluation-exception.js';
import { SpelMessage } from '../../error/spel-message.js';

export class Projection extends SpelNodeImpl {
  private readonly nullSafe: boolean;

  constructor(startPos: number, endPos: number, nullSafe: boolean,
    target: SpelNodeImpl, projection: SpelNodeImpl) {
    super(startPos, endPos, target, projection);
    this.nullSafe = nullSafe;
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const targetValue = this.children[0]!.getValue(state).getValue();

    if (targetValue === null || targetValue === undefined) {
      if (this.nullSafe) return TypedValue.NULL;
      throw new SpelEvaluationException(this.startPos, SpelMessage.PROJECTION_NOT_SUPPORTED_ON_TYPE, 'null');
    }

    if (!Array.isArray(targetValue) && !(targetValue instanceof Set) && !(targetValue instanceof Map)) {
      // Spring SpEL: non-collection is wrapped in single-element array for projection
      state.pushHeadIndex(new TypedValue(targetValue));
      try {
        const projected = this.children[1]!.getValue(state).getValue();
        return new TypedValue([projected]);
      } finally {
        state.popHeadIndex();
      }
    }

    const collection = targetValue instanceof Map
      ? [...targetValue.values()]
      : [...targetValue as Iterable<unknown>];
    const result: unknown[] = [];
    for (const item of collection) {
      state.pushHeadIndex(new TypedValue(item));
      try {
        result.push(this.children[1]!.getValue(state).getValue());
      } finally {
        state.popHeadIndex();
      }
    }
    return new TypedValue(result);
  }

  public toStringAST(): string {
    return `${this.children[0]!.toStringAST()}.![${this.children[1]!.toStringAST()}]`;
  }
}
