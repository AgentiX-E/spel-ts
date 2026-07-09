import { describe, it, expect } from 'vitest';
import { SpelParseException } from '../src/error/spel-parse-exception.js';
import { SpelEvaluationException } from '../src/error/spel-evaluation-exception.js';
import { SpelMessage } from '../src/error/spel-message.js';

describe('SpelParseException', () => {
  it('should create with position and message code', () => {
    const ex = new SpelParseException(10, SpelMessage.OODES, 'IDENTIFIER', 'NUMBER');
    expect(ex.position).toBe(10);
    expect(ex.messageCode).toBe(SpelMessage.OODES);
    expect(ex.inserts).toEqual(['IDENTIFIER', 'NUMBER']);
    expect(ex.name).toBe('SpelParseException');
  });

  it('should contain position in message', () => {
    const ex = new SpelParseException(5, SpelMessage.NOT_VALID_CHAR, '&');
    expect(ex.message).toContain('1002');
    expect(ex.message).toContain('&');
  });

  it('should be instanceof Error', () => {
    const ex = new SpelParseException(0, SpelMessage.OODES, 'x');
    expect(ex).toBeInstanceOf(Error);
  });

  it('toDetailedString should include expression and position', () => {
    const ex = new SpelParseException(3, SpelMessage.NOT_VALID_CHAR, '~');
    const detailed = ex.toDetailedString('1 + ~ 2');
    expect(detailed).toContain('position 3');
    expect(detailed).toContain('1 + ~ 2');
    expect(detailed).toContain('~');
  });

  it('toDetailedString should include message code', () => {
    const ex = new SpelParseException(0, SpelMessage.UNTERMINATED_STRING_LITERAL);
    const detailed = ex.toDetailedString("'hello");
    expect(detailed).toContain('[1007]');
  });

  it('should handle zero inserts', () => {
    const ex = new SpelParseException(0, SpelMessage.MISSING_TERNARY_COLON);
    expect(ex.inserts).toEqual([]);
  });

  it('should handle single insert', () => {
    const ex = new SpelParseException(0, SpelMessage.NOT_VALID_CHAR, '`');
    expect(ex.inserts).toEqual(['`']);
  });

  it('should handle multiple inserts', () => {
    const ex = new SpelParseException(
      0, SpelMessage.OPERATOR_NOT_SUPPORTED_BETWEEN_TYPES, '+', 'string', 'number');
    expect(ex.inserts).toEqual(['+', 'string', 'number']);
  });
});

describe('SpelEvaluationException', () => {
  it('should create with position and message code', () => {
    const ex = new SpelEvaluationException(15, SpelMessage.DIVISION_BY_ZERO);
    expect(ex.position).toBe(15);
    expect(ex.messageCode).toBe(SpelMessage.DIVISION_BY_ZERO);
    expect(ex.name).toBe('SpelEvaluationException');
  });

  it('should be instanceof Error', () => {
    const ex = new SpelEvaluationException(0, SpelMessage.TYPE_NOT_FOUND, 'Foo');
    expect(ex).toBeInstanceOf(Error);
  });

  it('should allow position to be mutable', () => {
    const ex = new SpelEvaluationException(-1, SpelMessage.PROPERTY_OR_FIELD_NOT_READABLE, 'x');
    ex.position = 42;
    expect(ex.position).toBe(42);
  });

  it('toDetailedString should include expression and position', () => {
    const ex = new SpelEvaluationException(6, SpelMessage.TYPE_NOT_FOUND, 'UnknownType');
    const detailed = ex.toDetailedString('T(UnknownType)');
    expect(detailed).toContain('position 6');
    expect(detailed).toContain('UnknownType');
  });

  it('toDetailedString should include message code', () => {
    const ex = new SpelEvaluationException(0, SpelMessage.BEAN_NOT_FOUND, 'myBean');
    const detailed = ex.toDetailedString('@myBean');
    expect(detailed).toContain('[2014]');
  });
});
