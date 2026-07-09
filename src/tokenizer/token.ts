import { TokenKind } from './token-kind.js';

/**
 * 对标 Spring Token
 *
 * 词法分析产生的 Token，包含位置、类型和可选的文本/附加数据。
 */
export class Token {
  public readonly kind: TokenKind;
  public readonly startPos: number;
  public readonly endPos: number;
  public readonly literal?: string;
  public readonly payload?: unknown;

  constructor(
    kind: TokenKind,
    startPos: number,
    endPos: number,
    literal?: string,
    payload?: unknown,
  ) {
    this.kind = kind;
    this.startPos = startPos;
    this.endPos = endPos;
    this.literal = literal;
    this.payload = payload;
  }

  public get length(): number {
    return this.endPos - this.startPos;
  }

  public isOperator(): boolean {
    return this.kind >= TokenKind.PLUS && this.kind <= TokenKind.INSTANCEOF;
  }

  public isLiteral(): boolean {
    return this.kind >= TokenKind.LITERAL_INT && this.kind <= TokenKind.LITERAL_NULL;
  }

  public isKeyword(): boolean {
    switch (this.kind) {
      case TokenKind.MOD:
      case TokenKind.EQ:
      case TokenKind.NE:
      case TokenKind.LT:
      case TokenKind.LE:
      case TokenKind.GT:
      case TokenKind.GE:
      case TokenKind.AND:
      case TokenKind.OR:
      case TokenKind.NOT:
      case TokenKind.MATCHES:
      case TokenKind.BETWEEN:
      case TokenKind.INSTANCEOF:
      case TokenKind.NEW:
        return true;
      default:
        return false;
    }
  }
}
