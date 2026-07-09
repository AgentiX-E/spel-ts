import { SpelParserConfiguration } from './spel-parser-configuration.js';
import { SpelExpression } from './spel-expression.js';
import type { SpelNodeImpl } from './ast/spel-node.js';
import { Tokenizer } from './tokenizer/tokenizer.js';
import { Token } from './tokenizer/token.js';
import { TokenKind } from './tokenizer/token-kind.js';
import { SpelParseException } from './error/spel-parse-exception.js';
import { SpelMessage } from './error/spel-message.js';

// AST Nodes
import { NullLiteral } from './ast/literal/null-literal.js';
import { BooleanLiteral } from './ast/literal/boolean-literal.js';
import { IntLiteral } from './ast/literal/int-literal.js';
import { LongLiteral } from './ast/literal/long-literal.js';
import { RealLiteral } from './ast/literal/real-literal.js';
import { FloatLiteral } from './ast/literal/float-literal.js';
import { StringLiteral } from './ast/literal/string-literal.js';
import { Identifier } from './ast/reference/identifier.js';
import { CompoundExpression } from './ast/reference/compound-expression.js';
import { VariableReference } from './ast/reference/variable-reference.js';
import { PropertyOrFieldReference } from './ast/reference/property-or-field-reference.js';

/**
 * 对标 Spring SpelExpressionParser
 *
 * SpEL 表达式解析器的公开 API 入口。
 */
export class SpelExpressionParser {
  private readonly configuration: SpelParserConfiguration;

  constructor(configuration?: SpelParserConfiguration) {
    this.configuration = configuration ?? SpelParserConfiguration.DEFAULT;
  }

  /**
   * 解析表达式字符串为编译后的 SpelExpression
   */
  public parseExpression(expressionString: string): SpelExpression {
    const parser = new InternalSpelExpressionParser(
      expressionString, this.configuration,
    );
    const ast = parser.parse();
    return new SpelExpression(expressionString, ast);
  }

  /**
   * 解析原始表达式字符串（不包装）
   */
  public parseRaw(expressionString: string): SpelNodeImpl {
    const parser = new InternalSpelExpressionParser(
      expressionString, this.configuration,
    );
    return parser.parse();
  }
}

/**
 * 对标 Spring InternalSpelExpressionParser
 *
 * 递归下降解析器，每个 eatXxx 方法对应一个产生式规则。
 */
class InternalSpelExpressionParser {
  private tokens: Token[] = [];
  private pos = 0;
  private readonly configuration: SpelParserConfiguration;
  private readonly expressionString: string;

  constructor(expressionString: string, configuration: SpelParserConfiguration) {
    this.expressionString = expressionString;
    this.configuration = configuration;
  }

  // ===== 入口 =====

  public parse(): SpelNodeImpl {
    this.tokens = new Tokenizer(this.expressionString).tokenize();
    const result = this.eatExpression();
    this.expect(TokenKind.EOF);
    return result;
  }

  // ===== 表达式 =====

  private eatExpression(): SpelNodeImpl {
    // For Phase 1, simply delegate to conditional expression
    // Assignment support comes in Phase 2
    return this.eatConditionalExpression();
  }

  /**
   * conditional_expression := or_expression
   *                           ('?' expression ':' expression)?
   *                           ('?:' expression)?
   */
  private eatConditionalExpression(): SpelNodeImpl {
    // Minimal implementation for Phase 1 — just delegate to primary
    return this.eatPrimaryExpression();
  }

  // ===== 基础表达式 =====

  private eatPrimaryExpression(): SpelNodeImpl {
    const token = this.peek();

    switch (token.kind) {
      case TokenKind.LITERAL_NULL:
        this.advance();
        return new NullLiteral(token.startPos, token.endPos);

      case TokenKind.LITERAL_BOOLEAN:
        this.advance();
        return new BooleanLiteral(token.startPos, token.endPos,
          token.payload as boolean);

      case TokenKind.LITERAL_INT:
        this.advance();
        return new IntLiteral(token.startPos, token.endPos,
          token.payload as number);

      case TokenKind.LITERAL_LONG:
        this.advance();
        return new LongLiteral(token.startPos, token.endPos,
          token.payload as number);

      case TokenKind.LITERAL_DOUBLE:
        this.advance();
        return new RealLiteral(token.startPos, token.endPos,
          token.payload as number);

      case TokenKind.LITERAL_FLOAT:
        this.advance();
        return new FloatLiteral(token.startPos, token.endPos,
          token.payload as number);

      case TokenKind.LITERAL_STRING:
        this.advance();
        return new StringLiteral(token.startPos, token.endPos,
          token.payload as string);

      case TokenKind.LITERAL_HEX:
        this.advance();
        return new IntLiteral(token.startPos, token.endPos,
          token.payload as number);

      case TokenKind.HASH: {
        return this.eatVariableOrFunction();
      }

      case TokenKind.LPAREN: {
        this.advance(); // 消费 '('
        const expr = this.eatExpression();
        this.expect(TokenKind.RPAREN);
        return expr;
      }

      case TokenKind.IDENTIFIER: {
        // 可能是 T(Type) 类型引用
        if (token.literal === 'T' || token.literal === 't') {
          const savedPos = this.pos;
          this.advance();
          if (this.peek().kind === TokenKind.LPAREN) {
            return this.eatTypeReference(token);
          }
          // 不是 T(...), 回退
          this.pos = savedPos;
        }
        // 普通标识符起始 — 可能是复合表达式
        return this.eatCompoundExpression();
      }

      default:
        throw this.raise(SpelMessage.OODES, token.literal!);
    }
  }

  // ===== 复合表达式 (属性链) =====

  private eatCompoundExpression(): SpelNodeImpl {
    const startPos = this.peek().startPos;
    const nodes: SpelNodeImpl[] = [];

    nodes.push(this.eatPrimaryTerm());

    while (this.peek().kind === TokenKind.DOT ||
           this.peek().kind === TokenKind.SAFE_NAV) {
      const dotToken = this.advance();
      const nullSafe = dotToken.kind === TokenKind.SAFE_NAV;

      const next = this.eatPrimaryTerm();
      if (nullSafe && next instanceof PropertyOrFieldReference) {
        next.nullSafe = true;
      }
      nodes.push(next);
    }

    if (nodes.length === 1) {
      return nodes[0]!;
    }

    return new CompoundExpression(startPos, nodes[nodes.length - 1]!.endPos, ...nodes);
  }

  /**
   * primary_term := identifier indexer_suffix? method_suffix?
   *               | '[' expression ']'
   */
  private eatPrimaryTerm(): SpelNodeImpl {
    const token = this.peek();

    if (token.kind === TokenKind.LBRACKET) {
      this.advance();
      const expr = this.eatExpression();
      this.expect(TokenKind.RBRACKET);
      return expr;
    }

    if (token.kind !== TokenKind.IDENTIFIER) {
      throw this.raise(SpelMessage.OODES, token.literal!);
    }

    const startPos = token.startPos;
    this.advance();

    // Simple identifier — wraps in PropertyOrFieldReference for resolution
    const propRef = new PropertyOrFieldReference(startPos, token.endPos, token.literal!);

    // Check for method call suffix: identifier(args)
    if (this.peek().kind === TokenKind.LPAREN) {
      return this.eatMethodCall(startPos, token.literal!);
    }

    return propRef;
  }

  // ===== 变量与函数 =====

  /**
   * #var 或 #func(args)
   */
  private eatVariableOrFunction(): SpelNodeImpl {
    const hashToken = this.advance(); // 消费 '#'
    const nameToken = this.expect(TokenKind.IDENTIFIER);
    const name = nameToken.literal!;

    return new VariableReference(hashToken.startPos, nameToken.endPos, name);
  }

  /**
   * T(Type) 类型引用 (简化版，完整实现见 Phase 2)
   */
  private eatTypeReference(_tToken: Token): SpelNodeImpl {
    this.advance(); // 消费 'T' token 后的 '('
    const typeName = this.eatQualifiedIdentifier();
    this.expect(TokenKind.RPAREN);

    // Placeholder for now — return as identifier
    return new Identifier(0, 0, `T(${typeName})`);
  }

  /**
   * 方法调用: identifier(args)
   */
  private eatMethodCall(startPos: number, methodName: string): SpelNodeImpl {
    this.advance(); // consume '('
    const endPos = this.peek(-1).endPos;

    // Just return it as a PropertyOrFieldReference for now
    // Full method call support in Phase 2
    while (this.peek().kind !== TokenKind.RPAREN && this.peek().kind !== TokenKind.EOF) {
      this.advance();
    }
    this.expect(TokenKind.RPAREN);

    return new PropertyOrFieldReference(startPos, endPos, methodName);
  }

  /**
   * 消费完整的限定标识符 (java.lang.String)
   */
  private eatQualifiedIdentifier(): string {
    const parts: string[] = [];
    const token = this.advance();
    parts.push(token.literal!);

    while (this.peek().kind === TokenKind.DOT) {
      this.advance(); // 消费 '.'
      const next = this.advance();
      parts.push(next.literal!);
    }

    return parts.join('.');
  }

  // ===== 工具方法 =====

  private peek(offset = 0): Token {
    const index = this.pos + offset;
    if (index >= this.tokens.length) {
      const eofPos = this.expressionString.length;
      return new Token(TokenKind.EOF, eofPos, eofPos);
    }
    return this.tokens[index]!;
  }

  private advance(): Token {
    const token = this.tokens[this.pos];
    if (token) {
      this.pos++;
      return token;
    }
    const eofPos = this.expressionString.length;
    return new Token(TokenKind.EOF, eofPos, eofPos);
  }

  private expect(kind: TokenKind): Token {
    const token = this.peek();
    if (token.kind !== kind) {
      throw this.raise(SpelMessage.OODES,
        TokenKind[kind], TokenKind[token.kind]);
    }
    return this.advance();
  }

  private raise(message: SpelMessage, ...args: string[]): SpelParseException {
    return new SpelParseException(this.peek().startPos, message, ...args);
  }
}
