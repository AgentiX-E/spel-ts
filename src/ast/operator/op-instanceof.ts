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
    const leftValue = this.children[0]!.getValue(state);
    const left = leftValue.getValue();
    const rightRaw = this.children[1]!.getValue(state).getValue();

    // instanceof T(Type): the right side resolves to a type handle
    if (isTypeDescriptor(rightRaw)) {
      // The numeric kind travels with the value, so a boxed check is answered from
      // what the operand was written as rather than from the host representation:
      // `1.0` and `1` are the same JavaScript number but a `double` and an `int`
      // in Java. It is `undefined` for a value that is not numeric, which the
      // descriptor then treats as "not a boxed numeric type".
      return new TypedValue(rightRaw.isInstance(left, leftValue.getNumericKind()));
    }

    // String-based: 'string', 'number', 'boolean', 'null', 'object'
    const typeName = String(rightRaw);

    if (typeName === 'null') {
      return new TypedValue(left === null);
    }

    return new TypedValue(typeof left === typeName);
  }
}
