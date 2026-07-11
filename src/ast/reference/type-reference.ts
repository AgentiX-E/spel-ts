import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';

/**
 * Type reference node — parallels Spring TypeReference
 */
export class TypeReference extends SpelNodeImpl {
  private readonly typeName: string;

  constructor(startPos: number, endPos: number, typeName: string) {
    super(startPos, endPos);
    this.typeName = typeName;
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const typeDesc = state.findType(this.typeName);
    return new TypedValue(typeDesc);
  }

  public toStringAST(): string {
    return `T(${this.typeName})`;
  }
}
