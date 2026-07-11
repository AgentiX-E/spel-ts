import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';

/**
 * Parallels Spring TypeConverter / SpelTypeConverter
 *
 * Type coercion, handles implicit type conversion in SpEL.
 */
export class SpelTypeConverter {
  /**
   * Try converting value to target type
   */
  public convertValue(value: unknown, targetType: new (...args: unknown[]) => unknown): unknown {
    // null → null (any type)
    if (value === null || value === undefined) {
      return null;
    }

    // Already matching type
    if (typeof value === 'string' && targetType === String) return value;
    if (typeof value === 'number' && targetType === Number) return value;
    if (typeof value === 'boolean' && targetType === Boolean) return value;

    // String → Number
    if (typeof value === 'string' && targetType === Number) {
      const num = parseFloat(value);
      if (isNaN(num)) {
        throw new SpelEvaluationException(
          -1,
          SpelMessage.TYPE_CONVERSION_ERROR,
          value,
          'Number',
        );
      }
      return num;
    }

    // Number → String
    if (typeof value === 'number' && targetType === String) {
      return String(value);
    }

    // String → Boolean
    if (typeof value === 'string' && targetType === Boolean) {
      const s = value.toLowerCase();
      if (s === 'true') return true;
      if (s === 'false') return false;
      throw new SpelEvaluationException(
        -1,
        SpelMessage.TYPE_CONVERSION_ERROR,
        value,
        'Boolean',
      );
    }

    // Boolean → String
    if (typeof value === 'boolean' && targetType === String) {
      return String(value);
    }

    // Number → Boolean (non-zero is truthy)
    if (typeof value === 'number' && targetType === Boolean) {
      return value !== 0;
    }

    // Boolean → Number
    if (typeof value === 'boolean' && targetType === Number) {
      return value ? 1 : 0;
    }

    // Cannot convert — value must be object/function at this point
    const typeLabel = typeof value;
    const valueStr = typeLabel;
    throw new SpelEvaluationException(
      -1,
      SpelMessage.TYPE_CONVERSION_ERROR,
      `${valueStr} (${typeLabel})`,
      targetType.name,
    );
  }

  /**
   * Check if conversion is possible
   */
  public canConvert(value: unknown, targetType: new (...args: unknown[]) => unknown): boolean {
    if (value === null || value === undefined) return true;
    const valueType = typeof value;
    if (valueType === 'string' && targetType === String) return true;
    if (valueType === 'number' && targetType === Number) return true;
    if (valueType === 'boolean' && targetType === Boolean) return true;

    if (valueType === 'string' && (targetType === Number || targetType === Boolean)) {
      return true;
    }
    if (valueType === 'number' && (targetType === String || targetType === Boolean)) {
      return true;
    }
    if (valueType === 'boolean' && (targetType === String || targetType === Number)) {
      return true;
    }
    return false;
  }
}
