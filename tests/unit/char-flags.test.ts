/**
 * Contract tests for the character-classification helpers.
 *
 * These functions are part of the package's public API (`src/index.ts` exports
 * them), so their behaviour is a compatibility surface and deserves explicit
 * tests rather than being exercised only incidentally through the tokenizer.
 *
 * The ASCII cases come from the pre-computed lookup table; the non-ASCII cases
 * come from the Unicode fallback added so that identifiers may contain any
 * letter, mirroring Spring's use of `Character.isLetter`.
 */
import { describe, expect, it } from 'vitest';
import {
  CharFlag,
  getCharFlag,
  isDigit,
  isHexDigit,
  isIdentifierPart,
  isIdentifierStart,
  isLetter,
  isOperator,
  isQuote,
  isWhitespace,
} from '../../src/tokenizer/char-flags.js';

const UPPER_A = 0x41;
const LOWER_Z = 0x7a;
const DIGIT_ZERO = 0x30;
const UNDERSCORE = 0x5f;
const DOLLAR = 0x24;
const HYPHEN = 0x2d;
const SPACE = 0x20;
const TAB = 0x09;
const NEWLINE = 0x0a;
const SINGLE_QUOTE = 0x27;
const DOUBLE_QUOTE = 0x22;
const CJK_MIDDLE = 0x4e2d; // 中
const LATIN_E_ACUTE = 0xe9; // é
const CURRENCY_EURO = 0x20ac; // €
const HIGH_SURROGATE = 0xd83d; // first half of an astral-plane emoji
const FULLWIDTH_DIGIT_ONE = 0xff11; // １
const ASTRAL_PLANE_LETTER = 0x1d400; // MATHEMATICAL BOLD CAPITAL A
const BEYOND_UNICODE = 0x110000;
const UPPER_F = 0x46;
const LOWER_G = 0x67;

describe('getCharFlag', () => {
  it('classifies ASCII characters', () => {
    expect(getCharFlag(UPPER_A) & CharFlag.LETTER).not.toBe(0);
    expect(getCharFlag(DIGIT_ZERO) & CharFlag.DIGIT).not.toBe(0);
    expect(getCharFlag(UNDERSCORE) & CharFlag.UNDERSCORE).not.toBe(0);
    expect(getCharFlag(DOLLAR) & CharFlag.DOLLAR).not.toBe(0);
    expect(getCharFlag(SPACE) & CharFlag.WHITESPACE).not.toBe(0);
    expect(getCharFlag(SINGLE_QUOTE) & CharFlag.QUOTE).not.toBe(0);
  });

  it('reports no flags outside the ASCII range', () => {
    expect(getCharFlag(CJK_MIDDLE)).toBe(CharFlag.NONE);
    expect(getCharFlag(BEYOND_UNICODE)).toBe(CharFlag.NONE);
    expect(getCharFlag(-1)).toBe(CharFlag.NONE);
  });
});

describe('isLetter', () => {
  it('accepts ASCII letters', () => {
    expect(isLetter(UPPER_A)).toBe(true);
    expect(isLetter(LOWER_Z)).toBe(true);
  });

  it('rejects ASCII non-letters', () => {
    expect(isLetter(DIGIT_ZERO)).toBe(false);
    expect(isLetter(UNDERSCORE)).toBe(false);
    expect(isLetter(SPACE)).toBe(false);
  });

  it('accepts non-ASCII Unicode letters, matching Character.isLetter', () => {
    expect(isLetter(CJK_MIDDLE)).toBe(true);
    expect(isLetter(LATIN_E_ACUTE)).toBe(true);
  });

  it('rejects non-ASCII characters that are not letters', () => {
    expect(isLetter(CURRENCY_EURO)).toBe(false);
    expect(isLetter(HIGH_SURROGATE)).toBe(false);
    expect(isLetter(FULLWIDTH_DIGIT_ONE)).toBe(false);
  });

  it('rejects code points outside the Unicode range', () => {
    expect(isLetter(-1)).toBe(false);
    expect(isLetter(BEYOND_UNICODE)).toBe(false);
  });

  it('rejects values above the BMP, which arrive as surrogate halves', () => {
    // The tokenizer advances by UTF-16 code unit, so an astral character reaches
    // these helpers as two surrogate halves, never as a whole code point.
    expect(isLetter(ASTRAL_PLANE_LETTER)).toBe(false);
    expect(isLetter(HIGH_SURROGATE)).toBe(false);
  });
});

describe('isDigit', () => {
  it('accepts ASCII digits', () => {
    expect(isDigit(DIGIT_ZERO)).toBe(true);
    expect(isDigit(0x39)).toBe(true);
  });

  it('rejects letters and non-ASCII digits', () => {
    expect(isDigit(UPPER_A)).toBe(false);
    expect(isDigit(FULLWIDTH_DIGIT_ONE)).toBe(false);
  });
});

describe('isHexDigit', () => {
  it('accepts 0-9, a-f and A-F', () => {
    expect(isHexDigit(DIGIT_ZERO)).toBe(true);
    expect(isHexDigit(0x61)).toBe(true);
    expect(isHexDigit(UPPER_F)).toBe(true);
  });

  it('rejects letters beyond f', () => {
    expect(isHexDigit(LOWER_G)).toBe(false);
  });
});

describe('isWhitespace', () => {
  it('accepts the four whitespace characters SpEL recognises', () => {
    expect(isWhitespace(SPACE)).toBe(true);
    expect(isWhitespace(TAB)).toBe(true);
    expect(isWhitespace(NEWLINE)).toBe(true);
    expect(isWhitespace(0x0d)).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isWhitespace(UPPER_A)).toBe(false);
    expect(isWhitespace(0x0b)).toBe(false);
  });
});

describe('isOperator', () => {
  it('accepts operator punctuation', () => {
    expect(isOperator(0x2b)).toBe(true); // +
    expect(isOperator(0x2e)).toBe(true); // .
    expect(isOperator(0x23)).toBe(true); // #
  });

  it('rejects letters and digits', () => {
    expect(isOperator(UPPER_A)).toBe(false);
    expect(isOperator(DIGIT_ZERO)).toBe(false);
  });
});

describe('isQuote', () => {
  it('accepts both quote characters', () => {
    expect(isQuote(SINGLE_QUOTE)).toBe(true);
    expect(isQuote(DOUBLE_QUOTE)).toBe(true);
  });

  it('rejects other punctuation', () => {
    expect(isQuote(HYPHEN)).toBe(false);
  });
});

describe('isIdentifierStart', () => {
  it('accepts letters, underscore and dollar', () => {
    expect(isIdentifierStart(UPPER_A)).toBe(true);
    expect(isIdentifierStart(UNDERSCORE)).toBe(true);
    expect(isIdentifierStart(DOLLAR)).toBe(true);
  });

  it('accepts non-ASCII letters, so Unicode identifiers may begin an expression', () => {
    expect(isIdentifierStart(CJK_MIDDLE)).toBe(true);
  });

  it('rejects digits and punctuation', () => {
    expect(isIdentifierStart(DIGIT_ZERO)).toBe(false);
    expect(isIdentifierStart(HYPHEN)).toBe(false);
    expect(isIdentifierStart(CURRENCY_EURO)).toBe(false);
  });
});

describe('isIdentifierPart', () => {
  it('accepts letters, digits, underscore and dollar', () => {
    expect(isIdentifierPart(UPPER_A)).toBe(true);
    expect(isIdentifierPart(DIGIT_ZERO)).toBe(true);
    expect(isIdentifierPart(UNDERSCORE)).toBe(true);
    expect(isIdentifierPart(DOLLAR)).toBe(true);
  });

  it('accepts non-ASCII letters', () => {
    expect(isIdentifierPart(CJK_MIDDLE)).toBe(true);
    expect(isIdentifierPart(LATIN_E_ACUTE)).toBe(true);
  });

  it('rejects punctuation and non-ASCII non-letters', () => {
    expect(isIdentifierPart(HYPHEN)).toBe(false);
    expect(isIdentifierPart(CURRENCY_EURO)).toBe(false);
  });
});
