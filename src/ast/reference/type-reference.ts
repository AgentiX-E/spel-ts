import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

/**
 * Type reference node — parallels Spring TypeReference
 */
export class TypeReference extends SpelNodeImpl {
  private readonly typeName: string;

  constructor(startPos: number, endPos: number, typeName: string) {
    super(NodeType.TYPE_REFERENCE, startPos, endPos);
    this.typeName = typeName;
  }

  public getTypeName(): string {
    return this.typeName;
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const typeDesc = state.findType(this.typeName);
    return new TypedValue(typeDesc);
  }

  public toStringAST(): string {
    return `T(${this.typeName})`;
  }
}
