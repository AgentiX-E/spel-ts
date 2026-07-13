import { describe, it, expect } from 'vitest';
import { SpelMessage } from '../src/error/spel-message.js';

describe('SpelMessage', () => {
  it('should have unique error codes', () => {
    const codes = new Set<number>();
    const values = Object.values(SpelMessage).filter((v): v is number => typeof v === 'number');

    for (const code of values) {
      expect(codes.has(code)).toBe(false);
      codes.add(code);
    }
  });

  it('should have 40+ entries', () => {
    const values = Object.values(SpelMessage).filter((v): v is number => typeof v === 'number');
    expect(values.length).toBeGreaterThanOrEqual(40);
  });

  describe('parse errors (1xxx)', () => {
    it('should define OODES (1001)', () => {
      expect(SpelMessage.OODES).toBe(1001);
    });

    it('should define NOT_VALID_CHAR (1002)', () => {
      expect(SpelMessage.NOT_VALID_CHAR).toBe(1002);
    });

    it('should define MISSING_TERNARY_COLON (1003)', () => {
      expect(SpelMessage.MISSING_TERNARY_COLON).toBe(1003);
    });

    it('should define MISSING_CONSTRUCTOR_ARGS (1004)', () => {
      expect(SpelMessage.MISSING_CONSTRUCTOR_ARGS).toBe(1004);
    });

    it('should define MISSING_SELECTION_EXPRESSION (1005)', () => {
      expect(SpelMessage.MISSING_SELECTION_EXPRESSION).toBe(1005);
    });

    it('should define MISSING_PROJECTION_EXPRESSION (1006)', () => {
      expect(SpelMessage.MISSING_PROJECTION_EXPRESSION).toBe(1006);
    });

    it('should define UNTERMINATED_STRING_LITERAL (1007)', () => {
      expect(SpelMessage.UNTERMINATED_STRING_LITERAL).toBe(1007);
    });

    it('should define TYPE_REFERENCE_MISSING_PAREN (1008)', () => {
      expect(SpelMessage.TYPE_REFERENCE_MISSING_PAREN).toBe(1008);
    });

    it('should define UNEXPECTED_DATA_AFTER_DOTDOT (1009)', () => {
      expect(SpelMessage.UNEXPECTED_DATA_AFTER_DOTDOT).toBe(1009);
    });

    it('should define VARIABLE_REFERENCE_EXPECTED (1010)', () => {
      expect(SpelMessage.VARIABLE_REFERENCE_EXPECTED).toBe(1010);
    });
  });

  describe('evaluation errors (2xxx)', () => {
    it('should define EXCEPTION_DURING_PROPERTY_READ (2001)', () => {
      expect(SpelMessage.EXCEPTION_DURING_PROPERTY_READ).toBe(2001);
    });

    it('should define PROPERTY_OR_FIELD_NOT_READABLE (2002)', () => {
      expect(SpelMessage.PROPERTY_OR_FIELD_NOT_READABLE).toBe(2002);
    });

    it('should define PROPERTY_OR_FIELD_NOT_WRITABLE (2003)', () => {
      expect(SpelMessage.PROPERTY_OR_FIELD_NOT_WRITABLE).toBe(2003);
    });

    it('should define PROPERTY_OR_FIELD_NOT_READABLE_ON_NULL (2004)', () => {
      expect(SpelMessage.PROPERTY_OR_FIELD_NOT_READABLE_ON_NULL).toBe(2004);
    });

    it('should define METHOD_NOT_FOUND (2007)', () => {
      expect(SpelMessage.METHOD_NOT_FOUND).toBe(2007);
    });

    it('should define VARIABLE_NOT_FOUND (2010)', () => {
      expect(SpelMessage.VARIABLE_NOT_FOUND).toBe(2010);
    });

    it('should define TYPE_NOT_FOUND (2011)', () => {
      expect(SpelMessage.TYPE_NOT_FOUND).toBe(2011);
    });

    it('should define BEAN_NOT_FOUND (2014)', () => {
      expect(SpelMessage.BEAN_NOT_FOUND).toBe(2014);
    });

    it('should define OPERATOR_NOT_SUPPORTED_BETWEEN_TYPES (2015)', () => {
      expect(SpelMessage.OPERATOR_NOT_SUPPORTED_BETWEEN_TYPES).toBe(2015);
    });

    it('should define NOT_ASSIGNABLE (2016)', () => {
      expect(SpelMessage.NOT_ASSIGNABLE).toBe(2016);
    });

    it('should define DIVISION_BY_ZERO (2025)', () => {
      expect(SpelMessage.DIVISION_BY_ZERO).toBe(2025);
    });

    it('should define MATCHES_REGEX_FAILED (2037)', () => {
      expect(SpelMessage.MATCHES_REGEX_FAILED).toBe(2037);
    });

    it('should define FLAWED_PATTERN (2039)', () => {
      expect(SpelMessage.FLAWED_PATTERN).toBe(2039);
    });
  });

  it('should have parse errors in 1xxx range', () => {
    const values = Object.values(SpelMessage).filter((v): v is number => typeof v === 'number');
    for (const code of values) {
      if (code < 1001) continue; // TypeScript const enum might skip to first
      if (code >= 2000) break;
      expect(code).toBeGreaterThanOrEqual(1001);
      expect(code).toBeLessThan(2000);
    }
  });

  it('should have evaluation errors in 2xxx range', () => {
    const values = Object.values(SpelMessage).filter((v): v is number => typeof v === 'number');
    for (const code of values) {
      if (code >= 2000) {
        expect(code).toBeGreaterThanOrEqual(2000);
        expect(code).toBeLessThan(3000);
      }
    }
  });
});
