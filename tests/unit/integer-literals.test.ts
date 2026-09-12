/**
 * Contract tests for exact integer literals.
 *
 * A literal within the safe integer range stays a `number`; beyond it the exact
 * value is carried as a `bigint`, because a JavaScript number cannot hold it.
 * Without that, `9007199254740993L` became `9007199254740992` and
 * `9007199254740993L - 9007199254740992L` evaluated to zero.
 */
import { describe, expect, it } from 'vitest';
import { Tokenizer } from '../../src/tokenizer/tokenizer.js';
import { TokenKind } from '../../src/tokenizer/token-kind.js';
import { SpelParseException } from '../../src/error/spel-parse-exception.js';
import { SpelMessage } from '../../src/error/spel-message.js';

function payloadOf(source: string): unknown {
  return new Tokenizer(source).tokenize()[0]?.payload;
}

function kindOf(source: string): TokenKind {
  return new Tokenizer(source).tokenize()[0]!.kind;
}

describe('integer literal payload', () => {
  it('keeps a small literal as a number', () => {
    expect(payloadOf('42')).toBe(42);
    expect(payloadOf('42L')).toBe(42);
    expect(payloadOf('0')).toBe(0);
  });

  it('keeps a literal within the safe range as a number', () => {
    expect(payloadOf('9007199254740991L')).toBe(9007199254740991);
    expect(payloadOf('-0')).toBe(0);
  });

  it('keeps a literal beyond the safe range exactly, as a bigint', () => {
    expect(payloadOf('9007199254740993L')).toBe(9007199254740993n);
    expect(payloadOf('9223372036854775807L')).toBe(9223372036854775807n);
    expect(payloadOf('9223372036854775807')).toBe(9223372036854775807n);
  });

  it('classifies the token kind independently of the payload type', () => {
    expect(kindOf('42L')).toBe(TokenKind.LITERAL_LONG);
    expect(kindOf('9007199254740993L')).toBe(TokenKind.LITERAL_LONG);
    expect(kindOf('42')).toBe(TokenKind.LITERAL_INT);
  });

  it('rejects a literal outside the 64-bit range', () => {
    // Java has no counterpart for such a literal, so it is a parse error rather
    // than a value silently truncated to something representable.
    expect(() => payloadOf('99999999999999999999L')).toThrow(SpelParseException);
    expect(() => payloadOf('-99999999999999999999L')).toThrow(SpelParseException);
  });

  it('reports INVALID_NUMBER for an out-of-range literal', () => {
    try {
      payloadOf('99999999999999999999L');
      expect.unreachable('the literal should not parse');
    } catch (error) {
      expect((error as SpelParseException).messageCode).toBe(SpelMessage.INVALID_NUMBER);
    }
  });

  it('accepts the exact bounds of a long', () => {
    expect(payloadOf('9223372036854775807L')).toBe(9223372036854775807n);
    expect(payloadOf('-9223372036854775808L')).toBe(-9223372036854775808n);
  });

  it('still rejects a literal one past the bounds', () => {
    expect(() => payloadOf('9223372036854775808L')).toThrow(SpelParseException);
    expect(() => payloadOf('-9223372036854775809L')).toThrow(SpelParseException);
  });

  it('leaves hexadecimal and octal literals as numbers', () => {
    expect(payloadOf('0xFF')).toBe(255);
    expect(payloadOf('0X1F')).toBe(31);
  });

  it('leaves floating literals as numbers', () => {
    expect(payloadOf('1.5')).toBe(1.5);
    expect(payloadOf('2.5F')).toBe(2.5);
    expect(payloadOf('1e3')).toBe(1000);
  });
});
