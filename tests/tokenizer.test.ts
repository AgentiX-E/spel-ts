import { describe, it, expect } from 'vitest';
import { Tokenizer } from '../src/tokenizer/tokenizer.js';
import { TokenKind } from '../src/tokenizer/token-kind.js';
import { Token } from '../src/tokenizer/token.js';

describe('Tokenizer', () => {
  // ===== Test Group 1: Whitespace Handling =====
  describe('whitespace handling', () => {
    it('should handle empty string', () => {
      const tokens = new Tokenizer('').tokenize();
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.kind).toBe(TokenKind.EOF);
    });

    it('should handle pure spaces', () => {
      const tokens = new Tokenizer('   ').tokenize();
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.kind).toBe(TokenKind.EOF);
    });

    it('should handle tabs and newlines', () => {
      const tokens = new Tokenizer('\t\n\r ').tokenize();
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.kind).toBe(TokenKind.EOF);
    });

    it('should trim leading whitespace', () => {
      const tokens = new Tokenizer('   42').tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_INT);
    });

    it('should trim trailing whitespace', () => {
      const tokens = new Tokenizer('42   ').tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_INT);
    });
  });

  // ===== Test Group 2: Identifiers =====
  describe('identifiers', () => {
    it('should tokenize simple identifier', () => {
      const tokens = new Tokenizer('foo').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.IDENTIFIER);
      expect(tokens[0]!.literal).toBe('foo');
    });

    it('should tokenize identifier with underscore', () => {
      const tokens = new Tokenizer('my_var').tokenize();
      expect(tokens[0]!.literal).toBe('my_var');
    });

    it('should tokenize identifier with numbers', () => {
      const tokens = new Tokenizer('var123').tokenize();
      expect(tokens[0]!.literal).toBe('var123');
    });

    it('should tokenize identifier with dollar sign', () => {
      const tokens = new Tokenizer('$scope').tokenize();
      expect(tokens[0]!.literal).toBe('$scope');
    });

    it('should start with underscore', () => {
      const tokens = new Tokenizer('_private').tokenize();
      expect(tokens[0]!.literal).toBe('_private');
    });
  });

  // ===== Test Group 3: Keywords =====
  describe('keywords', () => {
    const keywordCases: [string, TokenKind, unknown][] = [
      ['null', TokenKind.LITERAL_NULL, null],
      ['true', TokenKind.LITERAL_BOOLEAN, true],
      ['false', TokenKind.LITERAL_BOOLEAN, false],
      ['eq', TokenKind.EQ, undefined],
      ['ne', TokenKind.NE, undefined],
      ['lt', TokenKind.LT, undefined],
      ['le', TokenKind.LE, undefined],
      ['gt', TokenKind.GT, undefined],
      ['ge', TokenKind.GE, undefined],
      ['and', TokenKind.AND, undefined],
      ['or', TokenKind.OR, undefined],
      ['not', TokenKind.NOT, undefined],
      ['mod', TokenKind.MOD, undefined],
      ['matches', TokenKind.MATCHES, undefined],
      ['between', TokenKind.BETWEEN, undefined],
      ['instanceof', TokenKind.INSTANCEOF, undefined],
      ['new', TokenKind.NEW, undefined],
    ];

    for (const [word, expectedKind, expectedPayload] of keywordCases) {
      it(`should recognize "${word}" as keyword`, () => {
        const tokens = new Tokenizer(word).tokenize();
        expect(tokens[0]!.kind).toBe(expectedKind);
        if (expectedPayload !== undefined) {
          expect(tokens[0]!.payload).toBe(expectedPayload);
        }
      });
    }

    it('should treat "matchesx" as identifier, not keyword', () => {
      const tokens = new Tokenizer('matchesx').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.IDENTIFIER);
      expect(tokens[0]!.literal).toBe('matchesx');
    });

    it('should treat "match" as identifier (not keyword)', () => {
      const tokens = new Tokenizer('match').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.IDENTIFIER);
    });
  });

  // ===== Test Group 4: Number Literals =====
  describe('number literals', () => {
    it('should tokenize int: 0', () => {
      const tokens = new Tokenizer('0').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_INT);
      expect(tokens[0]!.payload).toBe(0);
    });

    it('should tokenize int: 42', () => {
      const tokens = new Tokenizer('42').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_INT);
      expect(tokens[0]!.payload).toBe(42);
    });

    it('should tokenize int: 999', () => {
      const tokens = new Tokenizer('999').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_INT);
      expect(tokens[0]!.payload).toBe(999);
    });

    it('should tokenize long: 42L', () => {
      const tokens = new Tokenizer('42L').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_LONG);
      expect(tokens[0]!.payload).toBe(42);
    });

    it('should tokenize long: 999l', () => {
      const tokens = new Tokenizer('999l').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_LONG);
      expect(tokens[0]!.payload).toBe(999);
    });

    it('should tokenize float: 3.14f', () => {
      const tokens = new Tokenizer('3.14f').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_FLOAT);
    });

    it('should tokenize float: 2.5F', () => {
      const tokens = new Tokenizer('2.5F').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_FLOAT);
    });

    it('should tokenize double: 3.14', () => {
      const tokens = new Tokenizer('3.14').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_DOUBLE);
    });

    it('should tokenize double: 2.5d', () => {
      const tokens = new Tokenizer('2.5d').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_DOUBLE);
    });

    it('should tokenize scientific: 1e10', () => {
      const tokens = new Tokenizer('1e10').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_DOUBLE);
      expect(tokens[0]!.payload).toBe(1e10);
    });

    it('should tokenize scientific: 2.5E-3', () => {
      const tokens = new Tokenizer('2.5E-3').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_DOUBLE);
    });

    it('should tokenize scientific: 1.5e+2f', () => {
      const tokens = new Tokenizer('1.5e+2f').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_FLOAT);
    });

    it('should tokenize hex: 0xFF', () => {
      const tokens = new Tokenizer('0xFF').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_HEX);
      expect(tokens[0]!.payload).toBe(255);
    });

    it('should tokenize hex: 0x1A2B', () => {
      const tokens = new Tokenizer('0x1A2B').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_HEX);
      expect(tokens[0]!.payload).toBe(0x1A2B);
    });

    it('should tokenize hex: 0XCAFE', () => {
      const tokens = new Tokenizer('0XCAFE').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_HEX);
      expect(tokens[0]!.payload).toBe(0xCAFE);
    });
  });

  // ===== Test Group 5: String Literals =====
  describe('string literals', () => {
    it("should tokenize single-quoted: 'hello'", () => {
      const tokens = new Tokenizer("'hello'").tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_STRING);
      expect(tokens[0]!.payload).toBe('hello');
    });

    it('should tokenize double-quoted: "world"', () => {
      const tokens = new Tokenizer('"world"').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_STRING);
      expect(tokens[0]!.payload).toBe('world');
    });

    it('should tokenize empty single-quoted', () => {
      const tokens = new Tokenizer("''").tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_STRING);
      expect(tokens[0]!.payload).toBe('');
    });

    it('should tokenize empty double-quoted', () => {
      const tokens = new Tokenizer('""').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LITERAL_STRING);
      expect(tokens[0]!.payload).toBe('');
    });

    it("should escape single quotes inside: 'it''s'", () => {
      const tokens = new Tokenizer("'it''s'").tokenize();
      expect(tokens[0]!.payload).toBe("it's");
    });

    it('should handle mixed quotes: "he\'s"', () => {
      const tokens = new Tokenizer("\"he's\"").tokenize();
      expect(tokens[0]!.payload).toBe("he's");
    });
  });

  // ===== Test Group 6: Single-char Operators =====
  describe('single-character operators', () => {
    const singleOps: [string, TokenKind][] = [
      ['+', TokenKind.PLUS],
      ['-', TokenKind.MINUS],
      ['/', TokenKind.SLASH],
      ['%', TokenKind.PERCENT],
      ['^', TokenKind.POWER],
      ['(', TokenKind.LPAREN],
      [')', TokenKind.RPAREN],
      ['[', TokenKind.LBRACKET],
      [']', TokenKind.RBRACKET],
      ['{', TokenKind.LBRACE],
      ['}', TokenKind.RBRACE],
      [',', TokenKind.COMMA],
      [':', TokenKind.COLON],
      ['.', TokenKind.DOT],
      ['?', TokenKind.QMARK],
      ['#', TokenKind.HASH],
      ['@', TokenKind.AT],
    ];

    for (const [op, kind] of singleOps) {
      it(`should tokenize "${op}" as ${TokenKind[kind]}`, () => {
        const tokens = new Tokenizer(op).tokenize();
        expect(tokens[0]!.kind).toBe(kind);
      });
    }
  });

  // ===== Test Group 7: Multi-char Operators =====
  describe('multi-character operators', () => {
    const multiOps: [string, TokenKind][] = [
      ['++', TokenKind.INC],
      ['--', TokenKind.DEC],
      ['==', TokenKind.EQ],
      ['!=', TokenKind.NE],
      ['<=', TokenKind.LE],
      ['>=', TokenKind.GE],
      ['&&', TokenKind.AND],
      ['||', TokenKind.OR],
      ['**', TokenKind.POWER],
      ['?.', TokenKind.SAFE_NAV],
      ['?:', TokenKind.ELVIS],
      ['&@', TokenKind.AMP_AT],
      ['..', TokenKind.DOTDOT],
      ['.![', TokenKind.PROJECTION],
      ['.?[', TokenKind.SELECTION],
      ['.$[', TokenKind.SELECT_FIRST],
      ['.^[', TokenKind.SELECT_FIRST],
      ['.*[', TokenKind.SELECT_LAST],
    ];

    for (const [op, kind] of multiOps) {
      it(`should tokenize "${op}" as ${TokenKind[kind]}`, () => {
        const tokens = new Tokenizer(op).tokenize();
        expect(tokens[0]!.kind).toBe(kind);
      });
    }
  });

  // ===== Test Group 8: Compound Expressions =====
  describe('compound expressions', () => {
    it('should tokenize a + b', () => {
      const tokens = new Tokenizer('a + b').tokenize();
      expect(tokens).toHaveLength(4); // IDENT, PLUS, IDENT, EOF
      expect(tokens[0]!.kind).toBe(TokenKind.IDENTIFIER);
      expect(tokens[1]!.kind).toBe(TokenKind.PLUS);
      expect(tokens[2]!.kind).toBe(TokenKind.IDENTIFIER);
    });

    it('should tokenize a.b.c', () => {
      const tokens = new Tokenizer('a.b.c').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.IDENTIFIER);
      expect(tokens[1]!.kind).toBe(TokenKind.DOT);
      expect(tokens[2]!.kind).toBe(TokenKind.IDENTIFIER);
      expect(tokens[3]!.kind).toBe(TokenKind.DOT);
      expect(tokens[4]!.kind).toBe(TokenKind.IDENTIFIER);
    });

    it('should tokenize #var', () => {
      const tokens = new Tokenizer('#var').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.HASH);
      expect(tokens[1]!.kind).toBe(TokenKind.IDENTIFIER);
    });

    it('should tokenize @bean', () => {
      const tokens = new Tokenizer('@bean').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.AT);
      expect(tokens[1]!.kind).toBe(TokenKind.IDENTIFIER);
    });

    it('should tokenize {1,2,3}', () => {
      const tokens = new Tokenizer('{1,2,3}').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LBRACE);
      expect(tokens[1]!.kind).toBe(TokenKind.LITERAL_INT);
      expect(tokens[2]!.kind).toBe(TokenKind.COMMA);
      expect(tokens[3]!.kind).toBe(TokenKind.LITERAL_INT);
      expect(tokens[4]!.kind).toBe(TokenKind.COMMA);
      expect(tokens[5]!.kind).toBe(TokenKind.LITERAL_INT);
      expect(tokens[6]!.kind).toBe(TokenKind.RBRACE);
    });

    it('should tokenize {key:\'value\'}', () => {
      const tokens = new Tokenizer("{key:'value'}").tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.LBRACE);
      expect(tokens[1]!.kind).toBe(TokenKind.IDENTIFIER);
      expect(tokens[2]!.kind).toBe(TokenKind.COLON);
      expect(tokens[3]!.kind).toBe(TokenKind.LITERAL_STRING);
      expect(tokens[4]!.kind).toBe(TokenKind.RBRACE);
    });

    it('should tokenize a.?[x>0]', () => {
      const tokens = new Tokenizer('a.?[x>0]').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.IDENTIFIER);
      expect(tokens[1]!.kind).toBe(TokenKind.SELECTION);
    });
  });

  // ===== Test Group 9: Negative and Unary =====
  describe('negative numbers and unary', () => {
    it('should tokenize -5 as MINUS + INT', () => {
      const tokens = new Tokenizer('-5').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.MINUS);
      expect(tokens[1]!.kind).toBe(TokenKind.LITERAL_INT);
    });

    it('should tokenize -3.14', () => {
      const tokens = new Tokenizer('-3.14').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.MINUS);
      expect(tokens[1]!.kind).toBe(TokenKind.LITERAL_DOUBLE);
    });

    it('should tokenize !true', () => {
      const tokens = new Tokenizer('!true').tokenize();
      expect(tokens[0]!.kind).toBe(TokenKind.NOT);
    });
  });

  // ===== Test Group 10: Position Tracking =====
  describe('position tracking', () => {
    it('should track startPos correctly for simple expression', () => {
      const tokens = new Tokenizer('a + b').tokenize();
      expect(tokens[0]!.startPos).toBe(0); // 'a'
      expect(tokens[1]!.startPos).toBe(2); // '+'
      expect(tokens[2]!.startPos).toBe(4); // 'b'
    });

    it('should track token length', () => {
      const tokens = new Tokenizer('abc').tokenize();
      expect(tokens[0]!.length).toBe(3);
    });
  });

  // ===== Test Group 11: Edge Cases =====
  describe('edge cases', () => {
    it('should handle just EOF', () => {
      const tokenizer = new Tokenizer('');
      const token = tokenizer.nextToken();
      expect(token.kind).toBe(TokenKind.EOF);
    });

    it('should handle many tokens', () => {
      const expr = 'a + b - c * d / e % f && g || h > i < j >= k <= l == m != n';
      const tokens = new Tokenizer(expr).tokenize();
      expect(tokens.length).toBeGreaterThan(20);
      expect(tokens[tokens.length - 1]!.kind).toBe(TokenKind.EOF);
    });
  });

  // ===== Test Group 12: Token Class Methods =====
  describe('Token class', () => {
    it('should correctly identify literal tokens', () => {
      const intToken = new Token(TokenKind.LITERAL_INT, 0, 1, '42', 42);
      expect(intToken.isLiteral()).toBe(true);
      expect(intToken.isOperator()).toBe(false);
    });

    it('should correctly identify operator tokens', () => {
      const plusToken = new Token(TokenKind.PLUS, 0, 1, '+');
      expect(plusToken.isOperator()).toBe(true);
      expect(plusToken.isLiteral()).toBe(false);
    });

    it('should correctly identify keyword tokens', () => {
      const andToken = new Token(TokenKind.AND, 0, 3, 'and');
      expect(andToken.isKeyword()).toBe(true);
    });

    it('should not treat IDENTIFIER as keyword', () => {
      const idToken = new Token(TokenKind.IDENTIFIER, 0, 3, 'foo');
      expect(idToken.isKeyword()).toBe(false);
    });

    it('should report correct length', () => {
      const token = new Token(TokenKind.IDENTIFIER, 10, 15, 'hello');
      expect(token.length).toBe(5);
    });
  });
});
