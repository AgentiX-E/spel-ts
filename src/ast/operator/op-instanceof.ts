import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import type { TypeDescriptor } from '../../type/type-descriptor.js';
import { NodeType } from '../../language/node-type.js';

export class OpInstanceof extends Operator {
  constructor(operatorName: string, startPos: number, endPos: number, ...operands: import('../spel-node.js').SpelNodeImpl[]) {
    super(NodeType.OP_INSTANCEOF, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const left = this.children[0]!.getValue(state).getValue();
    const rightRaw = this.children[1]!.getValue(state).getValue();

    // instanceof T(Type): right side resolves to a TypeDescriptor
    if (this.isTypeDescriptor(rightRaw)) {
      const td = rightRaw as TypeDescriptor;
      return new TypedValue(td.isInstance(left));
    }

    // String-based: 'string', 'number', 'boolean', 'null', 'object'
    const typeName = String(rightRaw);

    if (typeName === 'null') {
      return new TypedValue(left === null);
    }

    return new TypedValue(typeof left === typeName);
  }

  private isTypeDescriptor(value: unknown): boolean {
    return typeof value === 'object'
      && value !== null
      && 'name' in value
      && 'constructor' in value
      && 'isInstance' in value
      && typeof (value as Record<string, unknown>).isInstance === 'function';
  }
}
