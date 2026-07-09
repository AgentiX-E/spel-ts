import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';

export class Identifier extends SpelNodeImpl {
  private readonly name: string;

  constructor(startPos: number, endPos: number, name: string) {
    super(startPos, endPos);
    this.name = name;
  }

  public getValueInternal(_state: ExpressionState): TypedValue {
    return new TypedValue(this.name);
  }

  public toStringAST(): string {
    return this.name;
  }

  public getName(): string {
    return this.name;
  }
}
