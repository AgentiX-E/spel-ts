import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelEvaluationException } from '../../error/spel-evaluation-exception.js';
import { SpelMessage } from '../../error/spel-message.js';
import { SpelNodeImpl } from '../spel-node.js';
import { NodeType } from '../../language/node-type.js';

export class PropertyOrFieldReference extends SpelNodeImpl {
  private readonly name: string;
  public nullSafe = false;

  constructor(startPos: number, endPos: number, name: string) {
    super(NodeType.PROPERTY_OR_FIELD_REFERENCE, startPos, endPos);
    this.name = name;
  }

  /** Get the property/field name */
  public getName(): string {
    return this.name;
  }

  public override isWritable(_state: ExpressionState): boolean {
    return true;
  }

  public override setValue(state: ExpressionState, newValue: unknown): void {
    const context = state.getEvaluationContext();
    for (const accessor of context.getPropertyAccessors()) {
      const rootObj = state.getThis().getValue();
      if (rootObj !== null && rootObj !== undefined && accessor.canWrite(context, rootObj, this.name)) {
        accessor.write(context, rootObj, this.name, newValue);
        return;
      }
    }
    throw new SpelEvaluationException(this.startPos, SpelMessage.PROPERTY_OR_FIELD_NOT_WRITABLE, this.name);
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const target = state.getThis().getValue();
    const context = state.getEvaluationContext();

    if (target === null || target === undefined) {
      if (this.nullSafe) return TypedValue.NULL;
      throw new SpelEvaluationException(this.startPos, SpelMessage.PROPERTY_OR_FIELD_NOT_READABLE_ON_NULL, this.name);
    }

    for (const accessor of context.getPropertyAccessors()) {
      if (accessor.canRead(context, target, this.name)) {
        return accessor.read(context, target, this.name);
      }
    }

    throw new SpelEvaluationException(this.startPos, SpelMessage.PROPERTY_OR_FIELD_NOT_READABLE, this.name);
  }

  public toStringAST(): string {
    return this.name;
  }
}
