import { describe, it, expect } from 'vitest';
import {
  TypedValue,
  SpelMessage,
  SpelParseException,
  SpelEvaluationException,
  SpelParserConfiguration,
  LRUCache,
  SpelTypeConverter,
  CharFlag,
  getCharFlag,
  isLetter,
  isDigit,
  isHexDigit,
  isWhitespace,
  isOperator,
  isQuote,
  isIdentifierStart,
  isIdentifierPart,
} from '../src/index.js';

describe('Public API (index.ts exports)', () => {
  it('should export TypedValue', () => {
    expect(TypedValue).toBeDefined();
    expect(new TypedValue(42).getValue()).toBe(42);
  });

  it('should export SpelMessage', () => {
    expect(SpelMessage).toBeDefined();
    expect(SpelMessage.OODES).toBe(1001);
  });

  it('should export SpelParseException', () => {
    const ex = new SpelParseException(0, SpelMessage.OODES, 'x');
    expect(ex).toBeInstanceOf(SpelParseException);
  });

  it('should export SpelEvaluationException', () => {
    const ex = new SpelEvaluationException(0, SpelMessage.DIVISION_BY_ZERO);
    expect(ex).toBeInstanceOf(SpelEvaluationException);
  });

  it('should export SpelParserConfiguration', () => {
    expect(SpelParserConfiguration.DEFAULT).toBeDefined();
  });

  it('should export LRUCache', () => {
    const cache = new LRUCache<string, number>(2);
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });

  it('should export SpelTypeConverter', () => {
    const conv = new SpelTypeConverter();
    expect(conv.convertValue('42', Number)).toBe(42);
  });

  it('should export CharFlag', () => {
    expect(CharFlag.LETTER).toBe(1);
  });

  it('should export char flag functions', () => {
    expect(isLetter('a'.charCodeAt(0))).toBe(true);
    expect(isDigit('5'.charCodeAt(0))).toBe(true);
    expect(isHexDigit('F'.charCodeAt(0))).toBe(true);
    expect(isWhitespace(' '.charCodeAt(0))).toBe(true);
    expect(isOperator('+'.charCodeAt(0))).toBe(true);
    expect(isQuote("'".charCodeAt(0))).toBe(true);
    expect(isIdentifierStart('_'.charCodeAt(0))).toBe(true);
    expect(isIdentifierPart('5'.charCodeAt(0))).toBe(true);
    expect(getCharFlag('a'.charCodeAt(0))).toBe(CharFlag.LETTER);
  });

  it('should export types (verified by imports working)', () => {
    // If imports work, types are properly exported
    expect(true).toBe(true);
  });
});
