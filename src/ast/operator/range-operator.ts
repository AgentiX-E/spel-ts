import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';

/**
 * 范围运算符 `..` — 对标 Spring OpRange
 *
 * a..b 生成从 a 到 b (含) 的整数序列
 */
export class RangeOperator extends SpelNodeImpl {
  constructor(startPos: number, endPos: number, left: SpelNodeImpl, right: SpelNodeImpl) {
    super(startPos, endPos, left, right);
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const start = Number(this.children[0]!.getValue(state).getValue());
    const end = Number(this.children[1]!.getValue(state).getValue());

    const result: number[] = [];
    if (start <= end) {
      for (let i = start; i <= end; i++) {
        result.push(i);
      }
    } else {
      for (let i = start; i >= end; i--) {
        result.push(i);
      }
    }
    return new TypedValue(result);
  }

  public toStringAST(): string {
    return `(${this.children[0]!.toStringAST()}..${this.children[1]!.toStringAST()})`;
  }
}
