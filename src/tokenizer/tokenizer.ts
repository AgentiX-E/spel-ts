import { TokenKind } from './token-kind.js';
import { Token } from './token.js';
import { isLetter, isDigit, isHexDigit, isWhitespace } from './char-flags.js';
import { SpelParseException } from '../error/spel-parse-exception.js';
import { SpelMessage } from '../error/spel-message.js';

/**
 * 对标 Spring Tokenizer
 *
 * SpEL 词法分析器，将表达式字符串拆分成 Token 序列。
 * 使用字符分类表实现 O(1) 字符类型查询。
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
   * 主词法分析循环——返回下一个 Token
   */
  public nextToken(): Token {
    while (this.pos < this.maxPos) {
      const ch = this.expression.charCodeAt(this.pos);

      // 跳过空白
      if (isWhitespace(ch)) {
        this.pos++;
        continue;
      }

      // 标识符 / 关键字
      if (isLetter(ch) || ch === 95 /* _ */ || ch === 36 /* $ */) {
        return this.eatIdentifier();
      }

      // 数字字面量
      if (isDigit(ch)) {
        return this.eatNumberLiteral();
      }

      // 字符串字面量
      if (ch === 39 /* ' */ || ch === 34 /* " */) {
        return this.eatStringLiteral(ch);
      }

      // 操作符和分隔符
      return this.eatOperatorOrDelimiter();
    }

    return new Token(TokenKind.EOF, this.pos, this.pos);
  }

  /**
   * 消费标识符或关键字
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
   * 将标识符字符串分类为 Token：关键字或普通标识符
   */
  private identifierOrKeyword(start: number, text: string): Token {
    switch (text) {
      case 'null':   return new Token(TokenKind.LITERAL_NULL, start, this.pos, text, null);
      case 'true':   return new Token(TokenKind.LITERAL_BOOLEAN, start, this.pos, text, true);
      case 'false':  return new Token(TokenKind.LITERAL_BOOLEAN, start, this.pos, text, false);
      case 'eq':     return new Token(TokenKind.EQ, start, this.pos, text);
      case 'ne':     return new Token(TokenKind.NE, start, this.pos, text);
      case 'lt':     return new Token(TokenKind.LT, start, this.pos, text);
      case 'le':     return new Token(TokenKind.LE, start, this.pos, text);
      case 'gt':     return new Token(TokenKind.GT, start, this.pos, text);
      case 'ge':     return new Token(TokenKind.GE, start, this.pos, text);
      case 'and':    return new Token(TokenKind.AND, start, this.pos, text);
      case 'or':     return new Token(TokenKind.OR, start, this.pos, text);
      case 'not':    return new Token(TokenKind.NOT, start, this.pos, text);
      case 'mod':    return new Token(TokenKind.MOD, start, this.pos, text);
      case 'matches':return new Token(TokenKind.MATCHES, start, this.pos, text);
      case 'between':return new Token(TokenKind.BETWEEN, start, this.pos, text);
      case 'instanceof': return new Token(TokenKind.INSTANCEOF, start, this.pos, text);
      case 'new':    return new Token(TokenKind.NEW, start, this.pos, text);
      default:       return new Token(TokenKind.IDENTIFIER, start, this.pos, text);
    }
  }

  /**
   * 消费数字字面量 (支持 int, long, float, double, hex)
   */
  private eatNumberLiteral(): Token {
    const start = this.pos;

    // 十六进制 0x 或 0X
    if (this.expression.charCodeAt(this.pos) === 48 /* '0' */ &&
        this.pos + 1 < this.maxPos) {
      const next = this.expression.charCodeAt(this.pos + 1);
      if (next === 120 /* 'x' */ || next === 88 /* 'X' */) {
        this.pos += 2;
        while (this.pos < this.maxPos && isHexDigit(this.expression.charCodeAt(this.pos))) {
          this.pos++;
        }
        const text = this.expression.slice(start, this.pos);
        return new Token(TokenKind.LITERAL_HEX, start, this.pos, text,
          parseInt(text, 16));
      }
    }

    // 整数部分
    while (this.pos < this.maxPos && isDigit(this.expression.charCodeAt(this.pos))) {
      this.pos++;
    }

    let isFloat = false;

    // 小数部分
    if (this.pos < this.maxPos && this.expression.charCodeAt(this.pos) === 46 /* '.' */) {
      // 检查不是范围运算符 ..
      if (this.pos + 1 < this.maxPos &&
          this.expression.charCodeAt(this.pos + 1) === 46) {
        // 这是 .. 运��符，不消费
      } else {
        isFloat = true;
        this.pos++;
        while (this.pos < this.maxPos && isDigit(this.expression.charCodeAt(this.pos))) {
          this.pos++;
        }
      }
    }

    // 指数部分
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

    // 后缀
    let kind = TokenKind.LITERAL_INT;
    if (this.pos < this.maxPos) {
      const suffix = this.expression.charCodeAt(this.pos);
      switch (suffix) {
        case 76: case 108: // 'L' 'l'
          kind = TokenKind.LITERAL_LONG;
          this.pos++;
          break;
        case 70: case 102: // 'F' 'f'
          kind = TokenKind.LITERAL_FLOAT;
          this.pos++;
          break;
        case 68: case 100: // 'D' 'd'
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
    const value = kind === TokenKind.LITERAL_INT || kind === TokenKind.LITERAL_LONG
      ? parseInt(text, 10)
      : parseFloat(text);

    return new Token(kind, start, this.pos, text, value);
  }

  /**
   * 消费字符串字面量 (支持 '' 转义)
   */
  private eatStringLiteral(quote: number): Token {
    const start = this.pos;
    const quoteChar = String.fromCharCode(quote);

    this.pos++; // 跳过开始引号

    const parts: string[] = [];
    while (this.pos < this.maxPos) {
      const ch = this.expression.charCodeAt(this.pos);

      if (ch === quote) {
        // 检查是否是转义引号 '' 或 ""
        if (this.pos + 1 < this.maxPos &&
            this.expression.charCodeAt(this.pos + 1) === quote) {
          parts.push(quoteChar);
          this.pos += 2; // 跳过两个引号
        } else {
          this.pos++; // 跳过结束引号
          break;
        }
      } else {
        parts.push(this.expression[this.pos]!);
        this.pos++;
      }
    }

    // 检查是否到达末尾而字符串未结束
    if (this.pos > this.maxPos || (this.pos === this.maxPos && parts.length > 0)) {
      // 实际上如果循环正常退出（到达末尾），我们需要检查最后一个字符
    }

    const value = parts.join('');
    const raw = this.expression.slice(start, this.pos);
    return new Token(TokenKind.LITERAL_STRING, start, this.pos, raw, value);
  }

  /**
   * 消费操作符和分隔符——核心多字符匹配
   */
  private eatOperatorOrDelimiter(): Token {
    const start = this.pos;
    const ch = this.expression.charCodeAt(this.pos);

    this.pos++; // 先消费一个字符

    switch (ch) {
      // 单字符
      case 42: // *
        if (this.matchNext(42)) { // **
          this.pos++;
          return new Token(TokenKind.POWER, start, this.pos, '**');
        }
        return new Token(TokenKind.STAR, start, this.pos, '*');

      case 43: // +
        if (this.matchNext(43)) { // ++
          this.pos++;
          return new Token(TokenKind.INC, start, this.pos, '++');
        }
        return new Token(TokenKind.PLUS, start, this.pos, '+');

      case 45: // -
        if (this.matchNext(45)) { // --
          this.pos++;
          return new Token(TokenKind.DEC, start, this.pos, '--');
        }
        return new Token(TokenKind.MINUS, start, this.pos, '-');

      case 47: return new Token(TokenKind.SLASH, start, this.pos, '/');    // /
      case 37: return new Token(TokenKind.PERCENT, start, this.pos, '%');  // %
      case 94: return new Token(TokenKind.POWER, start, this.pos, '^');    // ^
      case 40: return new Token(TokenKind.LPAREN, start, this.pos, '(');   // (
      case 41: return new Token(TokenKind.RPAREN, start, this.pos, ')');   // )
      case 91: return new Token(TokenKind.LBRACKET, start, this.pos, '['); // [
      case 93: return new Token(TokenKind.RBRACKET, start, this.pos, ']'); // ]
      case 123: return new Token(TokenKind.LBRACE, start, this.pos, '{');  // {
      case 125: return new Token(TokenKind.RBRACE, start, this.pos, '}');  // }
      case 44: return new Token(TokenKind.COMMA, start, this.pos, ',');    // ,
      case 58: return new Token(TokenKind.COLON, start, this.pos, ':');    // :
      case 35: return new Token(TokenKind.HASH, start, this.pos, '#');     // #
      case 64: return new Token(TokenKind.AT, start, this.pos, '@');       // @

      case 33: { // !
        if (this.matchNext(61)) { // !=
          this.pos++;
          return new Token(TokenKind.NE, start, this.pos, '!=');
        }
        return new Token(TokenKind.NOT, start, this.pos, '!');
      }

      case 61: { // =
        if (this.matchNext(61)) { // ==
          this.pos++;
          return new Token(TokenKind.EQ, start, this.pos, '==');
        }
        return new Token(TokenKind.ASSIGN, start, this.pos, '=');
      }

      case 60: { // <
        if (this.matchNext(61)) { // <=
          this.pos++;
          return new Token(TokenKind.LE, start, this.pos, '<=');
        }
        return new Token(TokenKind.LT, start, this.pos, '<');
      }

      case 62: { // >
        if (this.matchNext(61)) { // >=
          this.pos++;
          return new Token(TokenKind.GE, start, this.pos, '>=');
        }
        return new Token(TokenKind.GT, start, this.pos, '>');
      }

      case 38: { // &
        if (this.matchNext(38)) { // &&
          this.pos++;
          return new Token(TokenKind.AND, start, this.pos, '&&');
        }
        if (this.matchNext(64)) { // &@
          this.pos++;
          return new Token(TokenKind.AMP_AT, start, this.pos, '&@');
        }
        throw new SpelParseException(SpelMessage.NOT_VALID_CHAR, start, '&');
      }

      case 124: { // |
        if (this.matchNext(124)) { // ||
          this.pos++;
          return new Token(TokenKind.OR, start, this.pos, '||');
        }
        throw new SpelParseException(SpelMessage.NOT_VALID_CHAR, start, '|');
      }

      case 63: { // ?
        if (this.matchNext(46)) { // ?.
          this.pos++;
          return new Token(TokenKind.SAFE_NAV, start, this.pos, '?.');
        }
        if (this.matchNext(58)) { // ?:
          this.pos++;
          return new Token(TokenKind.ELVIS, start, this.pos, '?:');
        }
        return new Token(TokenKind.QMARK, start, this.pos, '?');
      }

      case 46: { // .
        // 检查是否是 .![  .?[  .$[  .^[  .*[ 或 ..
        if (this.pos < this.maxPos) {
          const next = this.expression.charCodeAt(this.pos);
          if (next === 46) { // ..
            this.pos++;
            return new Token(TokenKind.DOTDOT, start, this.pos, '..');
          }
          if (next === 33 /* '!' */) {
            if (this.pos + 1 < this.maxPos &&
                this.expression.charCodeAt(this.pos + 1) === 91 /* '[' */) {
              this.pos += 2;
              return new Token(TokenKind.PROJECTION, start, this.pos, '.![');
            }
          }
          if (next === 63 /* '?' */) {
            if (this.pos + 1 < this.maxPos &&
                this.expression.charCodeAt(this.pos + 1) === 91 /* '[' */) {
              this.pos += 2;
              return new Token(TokenKind.SELECTION, start, this.pos, '.?[');
            }
          }
          if (next === 36 /* '$' */ || next === 94 /* '^' */) {
            if (this.pos + 1 < this.maxPos &&
                this.expression.charCodeAt(this.pos + 1) === 91 /* '[' */) {
              this.pos += 2;
              return new Token(TokenKind.SELECT_FIRST, start, this.pos,
                this.expression.slice(start, this.pos));
            }
          }
          if (next === 42 /* '*' */) {
            if (this.pos + 1 < this.maxPos &&
                this.expression.charCodeAt(this.pos + 1) === 91 /* '[' */) {
              this.pos += 2;
              return new Token(TokenKind.SELECT_LAST, start, this.pos, '.*[');
            }
          }
        }
        return new Token(TokenKind.DOT, start, this.pos, '.');
      }

      default:
        throw new SpelParseException(
          SpelMessage.NOT_VALID_CHAR,
          start,
          String.fromCharCode(ch),
        );
    }
  }

  /**
   * 检查当前位置字符是否匹配预期
   */
  private matchNext(expected: number): boolean {
    return this.pos < this.maxPos &&
           this.expression.charCodeAt(this.pos) === expected;
  }

  /**
   * 获取所有 Token (用于调试和测试)
   */
  public tokenize(): Token[] {
    const tokens: Token[] = [];
    let token: Token;
    while ((token = this.nextToken()).kind !== TokenKind.EOF) {
      tokens.push(token);
    }
    tokens.push(token); // 包含 EOF
    return tokens;
  }
}
