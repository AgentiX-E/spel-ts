import { describe, it, expect } from 'vitest';
import {
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
} from '../src/tokenizer/char-flags.js';

describe('CharFlag', () => {
  describe('enum values', () => {
    it('should have distinct bit flags', () => {
      expect(CharFlag.NONE).toBe(0);
      expect(CharFlag.LETTER).toBe(1);
      expect(CharFlag.DIGIT).toBe(2);
      expect(CharFlag.WHITESPACE).toBe(4);
      expect(CharFlag.OPERATOR).toBe(8);
      expect(CharFlag.QUOTE).toBe(16);
      expect(CharFlag.UNDERSCORE).toBe(32);
      expect(CharFlag.DOLLAR).toBe(64);
      expect(CharFlag.DOT).toBe(128);
      expect(CharFlag.EXPONENT).toBe(256);
      expect(CharFlag.SIGN).toBe(512);
    });

    it('should have no overlapping bits', () => {
      const flags = [
        CharFlag.LETTER,
        CharFlag.DIGIT,
        CharFlag.WHITESPACE,
        CharFlag.OPERATOR,
        CharFlag.QUOTE,
        CharFlag.UNDERSCORE,
        CharFlag.DOLLAR,
        CharFlag.DOT,
        CharFlag.EXPONENT,
        CharFlag.SIGN,
      ];
      for (let i = 0; i < flags.length; i++) {
        for (let j = i + 1; j < flags.length; j++) {
          expect(flags[i] & flags[j]).toBe(0);
        }
      }
    });
  });

  describe('getCharFlag', () => {
    it('should return NONE for out-of-range characters', () => {
      expect(getCharFlag(128)).toBe(CharFlag.NONE);
      expect(getCharFlag(1000)).toBe(CharFlag.NONE);
    });

    it('should return NONE for negative numbers', () => {
      expect(getCharFlag(-1)).toBe(CharFlag.NONE);
    });
  });

  describe('isLetter', () => {
    it('should return true for lowercase letters', () => {
      for (let c = 'a'.charCodeAt(0); c <= 'z'.charCodeAt(0); c++) {
        expect(isLetter(c)).toBe(true);
      }
    });

    it('should return true for uppercase letters', () => {
      for (let c = 'A'.charCodeAt(0); c <= 'Z'.charCodeAt(0); c++) {
        expect(isLetter(c)).toBe(true);
      }
    });

    it('should return false for digits', () => {
      for (let c = '0'.charCodeAt(0); c <= '9'.charCodeAt(0); c++) {
        expect(isLetter(c)).toBe(false);
      }
    });

    it('should return false for operators', () => {
      expect(isLetter('+'.charCodeAt(0))).toBe(false);
      expect(isLetter('-'.charCodeAt(0))).toBe(false);
    });
  });

  describe('isDigit', () => {
    it('should return true for 0-9', () => {
      for (let c = '0'.charCodeAt(0); c <= '9'.charCodeAt(0); c++) {
        expect(isDigit(c)).toBe(true);
      }
    });

    it('should return false for letters', () => {
      expect(isDigit('a'.charCodeAt(0))).toBe(false);
      expect(isDigit('Z'.charCodeAt(0))).toBe(false);
    });
  });

  describe('isHexDigit', () => {
    it('should return true for 0-9', () => {
      expect(isHexDigit('0'.charCodeAt(0))).toBe(true);
      expect(isHexDigit('9'.charCodeAt(0))).toBe(true);
    });

    it('should return true for a-f', () => {
      expect(isHexDigit('a'.charCodeAt(0))).toBe(true);
      expect(isHexDigit('f'.charCodeAt(0))).toBe(true);
    });

    it('should return true for A-F', () => {
      expect(isHexDigit('A'.charCodeAt(0))).toBe(true);
      expect(isHexDigit('F'.charCodeAt(0))).toBe(true);
    });

    it('should return false for g and G', () => {
      expect(isHexDigit('g'.charCodeAt(0))).toBe(false);
      expect(isHexDigit('G'.charCodeAt(0))).toBe(false);
    });
  });

  describe('isWhitespace', () => {
    it('should return true for space', () => {
      expect(isWhitespace(' '.charCodeAt(0))).toBe(true);
    });

    it('should return true for tab', () => {
      expect(isWhitespace('\t'.charCodeAt(0))).toBe(true);
    });

    it('should return true for newline', () => {
      expect(isWhitespace('\n'.charCodeAt(0))).toBe(true);
    });

    it('should return true for carriage return', () => {
      expect(isWhitespace('\r'.charCodeAt(0))).toBe(true);
    });

    it('should return false for non-whitespace', () => {
      expect(isWhitespace('a'.charCodeAt(0))).toBe(false);
    });
  });

  describe('isOperator', () => {
    const operatorChars = '+-*/%^<>=!|&?:,.()[]{}@#';

    it('should return true for all operator characters', () => {
      for (const ch of operatorChars) {
        expect(isOperator(ch.charCodeAt(0))).toBe(true);
      }
    });

    it('should return false for letters', () => {
      expect(isOperator('a'.charCodeAt(0))).toBe(false);
    });
  });

  describe('isQuote', () => {
    it('should return true for single quote', () => {
      expect(isQuote("'".charCodeAt(0))).toBe(true);
    });

    it('should return true for double quote', () => {
      expect(isQuote('"'.charCodeAt(0))).toBe(true);
    });

    it('should return false for other characters', () => {
      expect(isQuote('a'.charCodeAt(0))).toBe(false);
    });
  });

  describe('isIdentifierStart', () => {
    it('should return true for letters', () => {
      expect(isIdentifierStart('a'.charCodeAt(0))).toBe(true);
      expect(isIdentifierStart('Z'.charCodeAt(0))).toBe(true);
    });

    it('should return true for underscore', () => {
      expect(isIdentifierStart('_'.charCodeAt(0))).toBe(true);
    });

    it('should return true for dollar sign', () => {
      expect(isIdentifierStart('$'.charCodeAt(0))).toBe(true);
    });

    it('should return false for digits', () => {
      expect(isIdentifierStart('0'.charCodeAt(0))).toBe(false);
      expect(isIdentifierStart('9'.charCodeAt(0))).toBe(false);
    });

    it('should return false for operators', () => {
      expect(isIdentifierStart('+'.charCodeAt(0))).toBe(false);
    });
  });

  describe('isIdentifierPart', () => {
    it('should return true for letters', () => {
      expect(isIdentifierPart('a'.charCodeAt(0))).toBe(true);
    });

    it('should return true for digits', () => {
      expect(isIdentifierPart('5'.charCodeAt(0))).toBe(true);
    });

    it('should return true for underscore', () => {
      expect(isIdentifierPart('_'.charCodeAt(0))).toBe(true);
    });

    it('should return true for dollar sign', () => {
      expect(isIdentifierPart('$'.charCodeAt(0))).toBe(true);
    });

    it('should return false for operators', () => {
      expect(isIdentifierPart('+'.charCodeAt(0))).toBe(false);
    });
  });

  describe('combined flags', () => {
    it('letter E should have both LETTER and EXPONENT flags', () => {
      const flag = getCharFlag('E'.charCodeAt(0));
      expect(flag & CharFlag.LETTER).toBeTruthy();
      expect(flag & CharFlag.EXPONENT).toBeTruthy();
    });

    it('letter e should have both LETTER and EXPONENT flags', () => {
      const flag = getCharFlag('e'.charCodeAt(0));
      expect(flag & CharFlag.LETTER).toBeTruthy();
      expect(flag & CharFlag.EXPONENT).toBeTruthy();
    });

    it('dot should have both DOT and OPERATOR flags', () => {
      const flag = getCharFlag('.'.charCodeAt(0));
      expect(flag & CharFlag.DOT).toBeTruthy();
      expect(flag & CharFlag.OPERATOR).toBeTruthy();
    });

    it('plus should have both SIGN and OPERATOR flags', () => {
      const flag = getCharFlag('+'.charCodeAt(0));
      expect(flag & CharFlag.SIGN).toBeTruthy();
      expect(flag & CharFlag.OPERATOR).toBeTruthy();
    });
  });

  describe('performance — character table is pre-built', () => {
    it('should handle all ASCII 0-127 without error', () => {
      for (let c = 0; c < 128; c++) {
        // Just ensure no exceptions thrown
        const flag = getCharFlag(c);
        expect(typeof flag).toBe('number');
      }
    });
  });
});
