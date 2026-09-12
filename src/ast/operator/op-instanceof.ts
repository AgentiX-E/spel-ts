import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { Operator } from '../spel-node.js';
import { isTypeDescriptor } from '../../type/type-descriptor.js';
import { NodeType } from '../../language/node-type.js';

export class OpInstanceof extends Operator {
  constructor(
    operatorName: string,
    startPos: number,
    endPos: number,
    ...operands: import('../spel-node.js').SpelNodeImpl[]
  ) {
    super(NodeType.OP_INSTANCEOF, operatorName, startPos, endPos, ...operands);
  }

  public override getValueInternal(state: ExpressionState): TypedValue {
    const left = this.children[0]!.getValue(state).getValue();
    const rightRaw = this.children[1]!.getValue(state).getValue();

    // instanceof T(Type): the right side resolves to a type handle
    if (isTypeDescriptor(rightRaw)) {
      return new TypedValue(rightRaw.isInstance(left));
    }

    // String-based: 'string', 'number', 'boolean', 'null', 'object'
    const typeName = String(rightRaw);

    if (typeName === 'null') {
      return new TypedValue(left === null);
    }

    return new TypedValue(typeof left === typeName);
  }
}
