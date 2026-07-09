import { describe, it, expect, beforeEach } from 'vitest';
import { SpelTypeConverter } from '../src/bridge/type-coercion.js';
import { SpelEvaluationException } from '../src/error/spel-evaluation-exception.js';

describe('SpelTypeConverter', () => {
  let converter: SpelTypeConverter;

  beforeEach(() => {
    converter = new SpelTypeConverter();
  });

  describe('convertValue', () => {
    describe('null/undefined handling', () => {
      it('should return null for null input', () => {
        expect(converter.convertValue(null, String)).toBeNull();
      });

      it('should return null for undefined input', () => {
        expect(converter.convertValue(undefined, Number)).toBeNull();
      });
    });

    describe('same-type passthrough', () => {
      it('should pass through string when target is String', () => {
        expect(converter.convertValue('hello', String)).toBe('hello');
      });

      it('should pass through number when target is Number', () => {
        expect(converter.convertValue(42, Number)).toBe(42);
      });

      it('should pass through boolean when target is Boolean', () => {
        expect(converter.convertValue(true, Boolean)).toBe(true);
      });
    });

    describe('String → Number', () => {
      it('should convert integer string', () => {
        expect(converter.convertValue('42', Number)).toBe(42);
      });

      it('should convert float string', () => {
        expect(converter.convertValue('3.14', Number)).toBe(3.14);
      });

      it('should throw for non-numeric string', () => {
        expect(() => converter.convertValue('abc', Number))
          .toThrow(SpelEvaluationException);
      });
    });

    describe('Number → String', () => {
      it('should convert integer', () => {
        expect(converter.convertValue(42, String)).toBe('42');
      });

      it('should convert float', () => {
        expect(converter.convertValue(3.14, String)).toBe('3.14');
      });

      it('should convert 0', () => {
        expect(converter.convertValue(0, String)).toBe('0');
      });
    });

    describe('String → Boolean', () => {
      it('should convert "true" to true', () => {
        expect(converter.convertValue('true', Boolean)).toBe(true);
      });

      it('should convert "TRUE" to true (case insensitive)', () => {
        expect(converter.convertValue('TRUE', Boolean)).toBe(true);
      });

      it('should convert "false" to false', () => {
        expect(converter.convertValue('false', Boolean)).toBe(false);
      });

      it('should throw for invalid boolean string', () => {
        expect(() => converter.convertValue('yes', Boolean))
          .toThrow(SpelEvaluationException);
      });
    });

    describe('Boolean → String', () => {
      it('should convert true to "true"', () => {
        expect(converter.convertValue(true, String)).toBe('true');
      });

      it('should convert false to "false"', () => {
        expect(converter.convertValue(false, String)).toBe('false');
      });
    });

    describe('Number → Boolean', () => {
      it('should convert non-zero to true', () => {
        expect(converter.convertValue(1, Boolean)).toBe(true);
        expect(converter.convertValue(-1, Boolean)).toBe(true);
        expect(converter.convertValue(3.14, Boolean)).toBe(true);
      });

      it('should convert 0 to false', () => {
        expect(converter.convertValue(0, Boolean)).toBe(false);
      });
    });

    describe('Boolean → Number', () => {
      it('should convert true to 1', () => {
        expect(converter.convertValue(true, Number)).toBe(1);
      });

      it('should convert false to 0', () => {
        expect(converter.convertValue(false, Number)).toBe(0);
      });
    });

    describe('unsupported conversions', () => {
      it('should throw for unsupported type pair', () => {
        // Object → Number is not supported
        expect(() => converter.convertValue({}, Number as new (...args: unknown[]) => unknown))
          .toThrow(SpelEvaluationException);
      });
    });
  });

  describe('canConvert', () => {
    it('should return true for null/undefined', () => {
      expect(converter.canConvert(null, String)).toBe(true);
      expect(converter.canConvert(undefined, Number)).toBe(true);
    });

    it('should return true for same types', () => {
      expect(converter.canConvert('hello', String)).toBe(true);
      expect(converter.canConvert(42, Number)).toBe(true);
      expect(converter.canConvert(true, Boolean)).toBe(true);
    });

    it('should return true for String ↔ Number', () => {
      expect(converter.canConvert('42', Number)).toBe(true);
      expect(converter.canConvert(42, String)).toBe(true);
    });

    it('should return true for String ↔ Boolean', () => {
      expect(converter.canConvert('true', Boolean)).toBe(true);
      expect(converter.canConvert(true, String)).toBe(true);
    });

    it('should return true for Number ↔ Boolean', () => {
      expect(converter.canConvert(1, Boolean)).toBe(true);
      expect(converter.canConvert(true, Number)).toBe(true);
    });

    it('should return false for unsupported conversions', () => {
      expect(converter.canConvert({}, Number as new (...args: unknown[]) => unknown)).toBe(false);
    });
  });
});
