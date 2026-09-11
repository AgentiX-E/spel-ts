import { SpelEvaluationException } from '../../error/spel-evaluation-exception.js';
import { SpelMessage } from '../../error/spel-message.js';
import type { ExpressionState } from '../../expression-state.js';
import type { SpelNodeImpl } from '../spel-node.js';

/**
 * Evaluate an operand as a boolean.
 *
 * Spring's OperatorAnd, OperatorOr and OperatorNot coerce their operands to
 * Boolean and raise a type-conversion error when a value cannot be converted.
 * They therefore reject truthiness: `true and 5` is an error rather than `5`,
 * and `null and true` is an error rather than `null`.
 */
export function requireBoolean(operand: SpelNodeImpl, state: ExpressionState): boolean {
  const value = operand.getValue(state).getValue();
  if (typeof value === 'boolean') {
    return value;
  }
  throw new SpelEvaluationException(operand.startPos, SpelMessage.TYPE_CONVERSION_ERROR);
}
