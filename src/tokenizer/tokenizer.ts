import { TokenKind } from './token-kind.js';
import { OPERATOR_KEYWORDS } from './keyword-table.js';
import { Token } from './token.js';
import { isLetter, isDigit, isHexDigit, isWhitespace } from './char-flags.js';
import { foldAsciiUpper } from '../util/ascii.js';

/**
 * The bounds an integer literal may hold.
 *
 * An unsuffixed literal is an `int` in SpEL whatever its magnitude, and the `L`
 * suffix widens it to a `long`; `SAFE_INTEGER_MAX` is the largest value a
 * JavaScript number holds exactly. Literal digits are unsigned — a leading `-` is
 * a separate token — so no lower bound is needed here.
 */
const INT_LITERAL_MAX = BigInt('2147483647');
const LONG_MAX = BigInt('9223372036854775807');
const LONG_MIN = BigInt('-9223372036854775808');
const SAFE_INTEGER_MAX = BigInt('9007199254740991');
import { SpelParseException } from '../error/spel-parse-exception.js';
import { SpelMessage } from '../error/spel-message.js';

/**
 * Parallels Spring Tokenizer
 *
 * SpEL lexer: decomposes expression string into Token sequence.
 * O(1) character type queries via character classification table.
 */
export class Tokenizer {
  private readonly expression: string;
  private pos = 0;
  private readonly maxPos: number;

  constructor(expression: string) {
    this.expression = expression;
    this.maxPos = expression.length;
  }

  /**
   * Main lexical analysis loop — returns next Token
   */
  public nextToken(): Token {
    while (this.pos < this.maxPos) {
      const ch = this.expression.charCodeAt(this.pos);

      // Skip whitespace
      if (isWhitespace(ch)) {
        this.pos++;
        continue;
      }

      // Identifier / keyword
      if (isLetter(ch) || ch === 95 /* _ */ || ch === 36 /* $ */) {
        return this.eatIdentifier();
      }

      // Number literal
      if (isDigit(ch)) {
        return this.eatNumberLiteral();
      }

      // String literal
      if (ch === 39 /* ' */ || ch === 34 /* " */) {
        return this.eatStringLiteral(ch);
      }

      // Operators and delimiters
      return this.eatOperatorOrDelimiter();
    }

    return new Token(TokenKind.EOF, this.pos, this.pos);
  }

  /**
   * Consume identifier or keyword
   */
  private eatIdentifier(): Token {
    const start = this.pos;

    while (this.pos < this.maxPos) {
      const ch = this.expression.charCodeAt(this.pos);
      if (isLetter(ch) || isDigit(ch) || ch === 95 /* _ */ || ch === 36 /* $ */) {
        this.pos++;
      } else {
        break;
      }
    }

    const text = this.expression.slice(start, this.pos);
    return this.identifierOrKeyword(start, text);
  }

  /**
   * Classify an identifier string as a textual operator or a plain identifier.
   *
   * Spring folds the scanned text to upper case and searches
   * `ALTERNATIVE_OPERATOR_NAMES`, so every casing of a textual operator is
   * accepted: `div`, `Div`, `DIV`. Words such as `and`, `or`, `matches`,
   * `between`, `instanceof`, `new`, `true`, `false` and `null` are *not*
   * operators here — Spring resolves them in the parser with
   * `equalsIgnoreCase`, which keeps them usable as ordinary identifiers.
   */
  private identifierOrKeyword(start: number, text: string): Token {
    const operator = OPERATOR_KEYWORDS.get(foldAsciiUpper(text));
    if (operator !== undefined) {
      return new Token(operator, start, this.pos, text);
    }
    return new Token(TokenKind.IDENTIFIER, start, this.pos, text);
  }

  /**
   * Consume number literal (int, long, float, double, hex)
   */
  private eatNumberLiteral(): Token {
    const start = this.pos;

    // Hexadecimal 0x or 0X
    if (this.expression.charCodeAt(this.pos) === 48 /* '0' */ && this.pos + 1 < this.maxPos) {
      const next = this.expression.charCodeAt(this.pos + 1);
      if (next === 120 /* 'x' */ || next === 88 /* 'X' */) {
        this.pos += 2;
        while (this.pos < this.maxPos && isHexDigit(this.expression.charCodeAt(this.pos))) {
          this.pos++;
        }
        const text = this.expression.slice(start, this.pos);
        return new Token(
          TokenKind.LITERAL_HEX,
          start,
          this.pos,
          text,
          this.intPayload(this.exactInteger(text, start, SpelMessage.NOT_AN_INTEGER), text, start),
        );
      }
      // Octal: 0[0-7]+
      if (next >= 48 /* '0' */ && next <= 55 /* '7' */) {
        this.pos += 2;
        while (this.pos < this.maxPos) {
          const octCh = this.expression.charCodeAt(this.pos);
          if (octCh >= 48 && octCh <= 55) {
            this.pos++;
          } else {
            break;
          }
        }
        const text = this.expression.slice(start, this.pos);
        return new Token(
          TokenKind.LITERAL_INT,
          start,
          this.pos,
          text,
          this.intPayload(BigInt(Number.parseInt(text, 8)), text, start),
        );
      }
    }

    // Integer part
    while (this.pos < this.maxPos && isDigit(this.expression.charCodeAt(this.pos))) {
      this.pos++;
    }

    let isFloat = false;

    // Fractional part
    if (this.pos < this.maxPos && this.expression.charCodeAt(this.pos) === 46 /* '.' */) {
      // Check not range operator ..
      if (this.pos + 1 < this.maxPos && this.expression.charCodeAt(this.pos + 1) === 46) {
        // This is .. operator, do not consume
      } else {
        isFloat = true;
        this.pos++;
        while (this.pos < this.maxPos && isDigit(this.expression.charCodeAt(this.pos))) {
          this.pos++;
        }
      }
    }

    // Exponent part
    if (this.pos < this.maxPos) {
      const ch = this.expression.charCodeAt(this.pos);
      if (ch === 69 /* 'E' */ || ch === 101 /* 'e' */) {
        isFloat = true;
        this.pos++;
        if (this.pos < this.maxPos) {
          const sign = this.expression.charCodeAt(this.pos);
          if (sign === 43 /* '+' */ || sign === 45 /* '-' */) {
            this.pos++;
          }
        }
        while (this.pos < this.maxPos && isDigit(this.expression.charCodeAt(this.pos))) {
          this.pos++;
        }
      }
    }

    // Suffix
    let kind = TokenKind.LITERAL_INT;
    if (this.pos < this.maxPos) {
      const suffix = this.expression.charCodeAt(this.pos);
      switch (suffix) {
        case 76:
        case 108: // 'L' 'l'
          kind = TokenKind.LITERAL_LONG;
          this.pos++;
          break;
        case 70:
        case 102: // 'F' 'f'
          kind = TokenKind.LITERAL_FLOAT;
          this.pos++;
          break;
        case 68:
        case 100: // 'D' 'd'
          kind = TokenKind.LITERAL_DOUBLE;
          this.pos++;
          break;
        default:
          if (isFloat) {
            kind = TokenKind.LITERAL_DOUBLE;
          }
          break;
      }
    } else if (isFloat) {
      kind = TokenKind.LITERAL_DOUBLE;
    }

    const text = this.expression.slice(start, this.pos);
    let value: number | bigint;
    if (kind === TokenKind.LITERAL_INT) {
      value = this.intPayload(
        this.exactInteger(text, start, SpelMessage.NOT_AN_INTEGER),
        text,
        start,
      );
    } else if (kind === TokenKind.LITERAL_LONG) {
      value = this.longPayload(text, start);
    } else {
      value = parseFloat(text);
    }

    return new Token(kind, start, this.pos, text, value);
  }

  /**
   * Parse an integer literal's digits exactly.
   *
   * `BigInt` is used rather than `parseInt` because a literal near the 64-bit
   * boundary is not representable as a JavaScript number, and rounding it is how
   * `9007199254740993L` previously became `9007199254740992`.
   */
  private exactInteger(text: string, start: number, message: SpelMessage): bigint {
    try {
      return BigInt(text);
    } catch {
      throw new SpelParseException(start, message, text);
    }
  }

  /**
   * The payload of an unsuffixed literal, which SpEL types as an `int` whatever
   * its magnitude.
   *
   * Spring converts the digits with `Integer.parseInt` and raises
   * `NOT_AN_INTEGER` when they do not fit, so `3000000000` is a parse error and
   * `3000000000L` the only spelling. This port classified an unsuffixed literal
   * by its size instead, which accepted the first form.
   */
  private intPayload(exact: bigint, text: string, start: number): number {
    if (exact > INT_LITERAL_MAX) {
      throw new SpelParseException(start, SpelMessage.NOT_AN_INTEGER, text);
    }
    return Number(exact);
  }

  /**
   * The payload of an `L`-suffixed literal, which is a `long` in Java.
   *
   * Within the range a JavaScript number holds exactly it stays a `number`, so
   * `42L` is unchanged; beyond that the exact value is kept as a `bigint`. A value
   * outside the 64-bit range has no Java counterpart and is rejected, as Java
   * rejects such a literal.
   */
  private longPayload(text: string, start: number): number | bigint {
    const digits = text.endsWith('L') || text.endsWith('l') ? text.slice(0, -1) : text;

    const exact = this.exactInteger(digits, start, SpelMessage.INVALID_NUMBER);
    if (exact > LONG_MAX || exact < LONG_MIN) {
      throw new SpelParseException(start, SpelMessage.INVALID_NUMBER, text);
    }

    return exact <= SAFE_INTEGER_MAX ? Number(exact) : exact;
  }

  /**
   * Consume string literal (supports '' escaping)
   */
  private eatStringLiteral(quote: number): Token {
    const start = this.pos;
    const quoteChar = String.fromCharCode(quote);

    this.pos++; // Skip opening quote

    const parts: string[] = [];
    let foundClosingQuote = false;
    while (this.pos < this.maxPos) {
      const ch = this.expression.charCodeAt(this.pos);

      if (ch === quote) {
        // Check for escaped quote '' or ""
        if (this.pos + 1 < this.maxPos && this.expression.charCodeAt(this.pos + 1) === quote) {
          parts.push(quoteChar);
          this.pos += 2; // Skip two quotes
        } else {
          this.pos++; // Skip closing quote
          foundClosingQuote = true;
          break;
        }
      } else {
        parts.push(this.expression[this.pos]!);
        this.pos++;
      }
    }

    // Check if end of expression reached without closing string
    if (!foundClosingQuote) {
      throw new SpelParseException(start, SpelMessage.UNTERMINATED_STRING_LITERAL);
    }

    const value = parts.join('');
    const raw = this.expression.slice(start, this.pos);
    return new Token(TokenKind.LITERAL_STRING, start, this.pos, raw, value);
  }

  /**
   * Consume operators and delimiters — core multi-char matching
   */
  private eatOperatorOrDelimiter(): Token {
    const start = this.pos;
    const ch = this.expression.charCodeAt(this.pos);

    this.pos++; // Consume one character first

    switch (ch) {
      // Single character
      // Spring has no '**' operator. Its tokenizer emits two STAR tokens and
      // the parser then rejects the expression; '^' is the power operator.
      case 42: // *
        return new Token(TokenKind.STAR, start, this.pos, '*');

      case 43: // +
        if (this.matchNext(43)) {
          // ++
          this.pos++;
          return new Token(TokenKind.INC, start, this.pos, '++');
        }
        return new Token(TokenKind.PLUS, start, this.pos, '+');

      case 45: // -
        if (this.matchNext(45)) {
          // --
          this.pos++;
          return new Token(TokenKind.DEC, start, this.pos, '--');
        }
        return new Token(TokenKind.MINUS, start, this.pos, '-');

      case 47:
        return new Token(TokenKind.SLASH, start, this.pos, '/'); // /
      case 37:
        return new Token(TokenKind.PERCENT, start, this.pos, '%'); // %
      case 94:
        return new Token(TokenKind.POWER, start, this.pos, '^'); // ^
      case 40:
        return new Token(TokenKind.LPAREN, start, this.pos, '('); // (
      case 41:
        return new Token(TokenKind.RPAREN, start, this.pos, ')'); // )
      case 91:
        return new Token(TokenKind.LBRACKET, start, this.pos, '['); // [
      case 93:
        return new Token(TokenKind.RBRACKET, start, this.pos, ']'); // ]
      case 123:
        return new Token(TokenKind.LBRACE, start, this.pos, '{'); // {
      case 125:
        return new Token(TokenKind.RBRACE, start, this.pos, '}'); // }
      case 44:
        return new Token(TokenKind.COMMA, start, this.pos, ','); // ,
      case 58:
        return new Token(TokenKind.COLON, start, this.pos, ':'); // :
      case 35:
        return new Token(TokenKind.HASH, start, this.pos, '#'); // #
      case 64:
        return new Token(TokenKind.AT, start, this.pos, '@'); // @

      case 33: {
        // !
        if (this.matchNext(61)) {
          // !=
          this.pos++;
          return new Token(TokenKind.NE, start, this.pos, '!=');
        }
        return new Token(TokenKind.NOT, start, this.pos, '!');
      }

      case 61: {
        // =
        if (this.matchNext(61)) {
          // ==
          this.pos++;
          return new Token(TokenKind.EQ, start, this.pos, '==');
        }
        return new Token(TokenKind.ASSIGN, start, this.pos, '=');
      }

      case 60: {
        // <
        if (this.matchNext(61)) {
          // <=
          this.pos++;
          return new Token(TokenKind.LE, start, this.pos, '<=');
        }
        return new Token(TokenKind.LT, start, this.pos, '<');
      }

      case 62: {
        // >
        if (this.matchNext(61)) {
          // >=
          this.pos++;
          return new Token(TokenKind.GE, start, this.pos, '>=');
        }
        return new Token(TokenKind.GT, start, this.pos, '>');
      }

      case 38: {
        // &
        if (this.matchNext(38)) {
          // &&
          this.pos++;
          return new Token(TokenKind.AND, start, this.pos, '&&');
        }
        if (this.matchNext(64)) {
          // &@
          this.pos++;
          return new Token(TokenKind.AMP_AT, start, this.pos, '&@');
        }
        throw new SpelParseException(SpelMessage.NOT_VALID_CHAR, start, '&');
      }

      case 124: {
        // |
        if (this.matchNext(124)) {
          // ||
          this.pos++;
          return new Token(TokenKind.OR, start, this.pos, '||');
        }
        throw new SpelParseException(SpelMessage.NOT_VALID_CHAR, start, '|');
      }

      case 63: {
        // ?
        if (this.matchNext(46)) {
          // ?.
          this.pos++;
          return new Token(TokenKind.SAFE_NAV, start, this.pos, '?.');
        }
        if (this.matchNext(58)) {
          // ?:
          this.pos++;
          return new Token(TokenKind.ELVIS, start, this.pos, '?:');
        }
        return new Token(TokenKind.QMARK, start, this.pos, '?');
      }

      case 46: {
        // .
        // Check for .![ .?[ .$[ .^[ .*[ or ..
        if (this.pos < this.maxPos) {
          const next = this.expression.charCodeAt(this.pos);
          if (next === 46) {
            // ..
            this.pos++;
            return new Token(TokenKind.DOTDOT, start, this.pos, '..');
          }
          if (next === 33 /* '!' */) {
            if (
              this.pos + 1 < this.maxPos &&
              this.expression.charCodeAt(this.pos + 1) === 91 /* '[' */
            ) {
              this.pos += 2;
              return new Token(TokenKind.PROJECTION, start, this.pos, '.![');
            }
          }
          if (next === 63 /* '?' */) {
            if (
              this.pos + 1 < this.maxPos &&
              this.expression.charCodeAt(this.pos + 1) === 91 /* '[' */
            ) {
              this.pos += 2;
              return new Token(TokenKind.SELECTION, start, this.pos, '.?[');
            }
          }
          // Spring defines '^[' as select-first and '$[' as select-last. The
          // previous mapping sent both to SELECT_FIRST and also accepted '.*[',
          // which is not SpEL at all, so `items.$[x]` returned the first match.
          if (next === 94 /* '^' */ || next === 36 /* '$' */) {
            if (
              this.pos + 1 < this.maxPos &&
              this.expression.charCodeAt(this.pos + 1) === 91 /* '[' */
            ) {
              const selectFirst = next === 94;
              this.pos += 2;
              return new Token(
                selectFirst ? TokenKind.SELECT_FIRST : TokenKind.SELECT_LAST,
                start,
                this.pos,
                this.expression.slice(start, this.pos),
              );
            }
          }
        }
        return new Token(TokenKind.DOT, start, this.pos, '.');
      }

      default:
        throw new SpelParseException(SpelMessage.NOT_VALID_CHAR, start, String.fromCharCode(ch));
    }
  }

  /**
   * Check if current position character matches expected
   */
  private matchNext(expected: number): boolean {
    return this.pos < this.maxPos && this.expression.charCodeAt(this.pos) === expected;
  }

  /**
   * Get all tokens (for debugging and testing)
   */
  public tokenize(): Token[] {
    const tokens: Token[] = [];
    let token: Token;
    while ((token = this.nextToken()).kind !== TokenKind.EOF) {
      tokens.push(token);
    }
    tokens.push(token); // Include EOF
    return tokens;
  }
}
