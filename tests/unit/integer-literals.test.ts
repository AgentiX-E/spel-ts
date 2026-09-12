/**
 * Contract tests for integer literals.
 *
 * An unsuffixed literal is an `int` in SpEL whatever its magnitude, and the `L`
 * suffix is what widens it to a `long` — so a value that does not fit its kind is
 * a parse error rather than a value of some larger kind. Within the range a
 * JavaScript number holds exactly a literal stays a `number`; beyond it the exact
 * value is carried as a `bigint`, because a number cannot hold it. Without that,
 * `9007199254740993L` became `9007199254740992` and
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
  return new Tokenizer(source).tokenize()[0].kind;
}

describe('integer literal payload', () => {
  it('keeps a small literal as a number', () => {
    expect(payloadOf('42')).toBe(42);
    expect(payloadOf('42L')).toBe(42);
    expect(payloadOf('0')).toBe(0);
  });

  it('keeps a literal within the safe range as a number', () => {
    expect(payloadOf('9007199254740991L')).toBe(9007199254740991);
  });

  it('lexes a leading minus as an operator, not as part of the literal', () => {
    // Spring's Tokenizer emits MINUS and then the digits and leaves unary minus
    // to the parser, so the first token carries no numeric payload. `-5` is
    // therefore evaluated, not lexed.
    expect(kindOf('-5')).toBe(TokenKind.MINUS);
    expect(payloadOf('-5')).toBeUndefined();
  });

  it('keeps a literal beyond the safe range exactly, as a bigint', () => {
    expect(payloadOf('9007199254740993L')).toBe(9007199254740993n);
    expect(payloadOf('9223372036854775807L')).toBe(9223372036854775807n);
  });

  it('types an unsuffixed literal as an int whatever its magnitude', () => {
    // Spring reaches the same conclusion from the other direction:
    // `Literal.getIntLiteral` calls `Integer.parseInt`, so `2147483648` raises
    // NOT_AN_INTEGER and the `L` suffix is the only way to write it. This port
    // typed such a literal by its size instead, which accepted all of these.
    expect(payloadOf('2147483647')).toBe(2147483647);
    expect(() => payloadOf('2147483648')).toThrow(SpelParseException);
    expect(() => payloadOf('3000000000')).toThrow(SpelParseException);
    expect(() => payloadOf('9223372036854775807')).toThrow(SpelParseException);
    // The digits are unsigned and checked before unary minus is applied, so the
    // lowest int cannot be written negatively either — the same rule that stops
    // `-9223372036854775808L`. The expression is lexed as a whole, so not even the
    // `MINUS` token survives; Spring reaches the same conclusion one stage later,
    // when the parser converts the digits.
    expect(() => payloadOf('-2147483648')).toThrow(SpelParseException);
    expect(() => kindOf('-2147483648')).toThrow(SpelParseException);
    // One less is fine, and lexes as MINUS over the digits.
    expect(kindOf('-2147483647')).toBe(TokenKind.MINUS);
  });

  it('reports NOT_AN_INTEGER for an unsuffixed literal that does not fit', () => {
    try {
      payloadOf('3000000000');
      expect.unreachable('the literal should not parse');
    } catch (error) {
      expect((error as SpelParseException).messageCode).toBe(SpelMessage.NOT_AN_INTEGER);
    }
  });

  it('accepts the same value once it is suffixed', () => {
    expect(kindOf('2147483648L')).toBe(TokenKind.LITERAL_LONG);
    expect(payloadOf('2147483648L')).toBe(2147483648);
    // `payloadOf` peeks the first token, so it cannot express arithmetic; the
    // expression-level case — `2147483647L + 1L` yielding 2147483648 rather than
    // wrapping — lives in the conformance corpus, where it is evaluated.
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

  it('accepts the exact upper bound of a long', () => {
    expect(payloadOf('9223372036854775807L')).toBe(9223372036854775807n);
    // Long.MIN_VALUE cannot be written negatively here. The magnitude is what is
    // range-checked, and it is checked before unary minus is applied: Spring
    // lexes the digits alone and converts "9223372036854775808", so JLS 3.10.1's
    // special case for a negated literal does not reach SpEL.
    expect(() => payloadOf('-9223372036854775808L')).toThrow(SpelParseException);
  });

  it('still rejects a literal one past the bounds', () => {
    expect(() => payloadOf('9223372036854775808L')).toThrow(SpelParseException);
    expect(() => payloadOf('-9223372036854775809L')).toThrow(SpelParseException);
  });

  it('lexes hexadecimal literals as numbers and range-checks them', () => {
    // Unsuffixed hexadecimal is an `int` in SpEL too, and Spring converts it with
    // `Integer.parseInt(digits, 16)`, so the int bound applies to it as well.
    expect(payloadOf('0xFF')).toBe(255);
    expect(payloadOf('0X1F')).toBe(31);
    expect(payloadOf('0x7FFFFFFF')).toBe(2147483647);
    expect(() => payloadOf('0xFFFFFFFF')).toThrow(SpelParseException);
    // `0x` carries no digits, which Spring reports the same way.
    expect(() => payloadOf('0x')).toThrow(SpelParseException);
  });

  it('leaves floating literals as numbers', () => {
    expect(payloadOf('1.5')).toBe(1.5);
    expect(payloadOf('2.5F')).toBe(2.5);
    expect(payloadOf('1e3')).toBe(1000);
  });
});
