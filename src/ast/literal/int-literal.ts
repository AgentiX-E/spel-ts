import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Literal } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

/**
 * An unsuffixed integer literal.
 *
 * SpEL types it as an `int` whatever its magnitude — the tokenizer rejects a
 * literal that does not fit, as Spring does — so the numeric kind is fixed. It
 * previously followed the magnitude, which made `2147483904` a `long` and, in the
 * other direction, left the `int` arithmetic wrap reachable for values Spring
 * never reaches.
 */
export class IntLiteral extends Literal {
  private readonly value: number;

  constructor(startPos: number, endPos: number, value: number) {
    super(NodeType.INT_LITERAL, startPos, endPos, String(value));
    this.value = Math.trunc(value);
  }

  /** Get the parsed integer value */
  public getParsedValue(): number {
    return this.value;
  }

  public getValueInternal(_state: ExpressionState): TypedValue {
    return new TypedValue(this.value, null, 'int');
  }

  public toStringAST(): string {
    return String(this.value);
  }
}
