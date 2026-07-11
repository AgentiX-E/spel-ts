import { SpelParserConfiguration } from './spel-parser-configuration.js';
import { SpelExpression } from './spel-expression.js';
import type { SpelNodeImpl } from './ast/spel-node.js';
import { Tokenizer } from './tokenizer/tokenizer.js';
import { Token } from './tokenizer/token.js';
import { TokenKind } from './tokenizer/token-kind.js';
import { SpelParseException } from './error/spel-parse-exception.js';
import { SpelMessage } from './error/spel-message.js';

// AST Literal Nodes
import { NullLiteral } from './ast/literal/null-literal.js';
import { BooleanLiteral } from './ast/literal/boolean-literal.js';
import { IntLiteral } from './ast/literal/int-literal.js';
import { LongLiteral } from './ast/literal/long-literal.js';
import { RealLiteral } from './ast/literal/real-literal.js';
import { FloatLiteral } from './ast/literal/float-literal.js';
import { StringLiteral } from './ast/literal/string-literal.js';

// AST Reference Nodes
import { CompoundExpression } from './ast/reference/compound-expression.js';
import { VariableReference } from './ast/reference/variable-reference.js';
import { PropertyOrFieldReference } from './ast/reference/property-or-field-reference.js';
import { Indexer } from './ast/reference/indexer.js';
import { MethodReference } from './ast/reference/method-reference.js';
import { ConstructorReference } from './ast/reference/constructor-reference.js';
import { BeanReference } from './ast/reference/bean-reference.js';
import { TypeReference } from './ast/reference/type-reference.js';

// AST Control Flow Nodes
import { Ternary } from './ast/control-flow/ternary.js';
import { Elvis } from './ast/control-flow/elvis.js';
import { Assign } from './ast/control-flow/assign.js';

// AST Collection Nodes
import { InlineList } from './ast/collection/inline-list.js';
import { InlineMap } from './ast/collection/inline-map.js';
import { Selection, SelectMode } from './ast/collection/selection.js';
import { Projection } from './ast/collection/projection.js';

// AST Operator Nodes
import { OpPlus } from './ast/operator/op-plus.js';
import { OpMinus } from './ast/operator/op-minus.js';
import { OpMultiply } from './ast/operator/op-multiply.js';
import { OpDivide } from './ast/operator/op-divide.js';
import { OpModulus } from './ast/operator/op-modulus.js';
import { OpPower } from './ast/operator/op-power.js';
import { RangeOperator } from './ast/operator/range-operator.js';
import { OpEQ } from './ast/operator/op-eq.js';
import { OpNE } from './ast/operator/op-ne.js';
import { OpLT } from './ast/operator/op-lt.js';
import { OpLE } from './ast/operator/op-le.js';
import { OpGT } from './ast/operator/op-gt.js';
import { OpGE } from './ast/operator/op-ge.js';
import { OpAnd } from './ast/operator/op-and.js';
import { OpOr } from './ast/operator/op-or.js';
import { OpNot } from './ast/operator/op-not.js';
import { OpMatches } from './ast/operator/op-matches.js';
import { OpBetween } from './ast/operator/op-between.js';
import { OpInstanceof } from './ast/operator/op-instanceof.js';
import { OpInc } from './ast/operator/op-inc.js';
import { OpDec } from './ast/operator/op-dec.js';

/**
 * 对标 Spring SpelExpressionParser — 公开 API 入口
 */
export class SpelExpressionParser {
  private readonly configuration: SpelParserConfiguration;

  constructor(configuration?: SpelParserConfiguration) {
    this.configuration = configuration ?? SpelParserConfiguration.DEFAULT;
  }

  public parseExpression(expressionString: string): SpelExpression {
    const parser = new InternalSpelExpressionParser(expressionString);
    const ast = parser.parse();
    return new SpelExpression(expressionString, ast);
  }

  public parseRaw(expressionString: string): SpelNodeImpl {
    const parser = new InternalSpelExpressionParser(expressionString);
    return parser.parse();
  }
}

/**
 * 对标 Spring InternalSpelExpressionParser
 *
 * 递归下降解析器 — 按 Spring SpEL 操作符优先级链：
 *   Assignment → Conditional → Or → And → Equality → Relational
 *   → Additive → Multiplicative → Power → Unary → Primary
 */
class InternalSpelExpressionParser {
  private tokens: Token[] = [];
  private pos = 0;
  private readonly expressionString: string;

  constructor(expressionString: string) {
    this.expressionString = expressionString;
  }

  // ==================== ENTRY ====================

  public parse(): SpelNodeImpl {
    this.tokens = new Tokenizer(this.expressionString).tokenize();
    const result = this.eatExpression();
    this.expect(TokenKind.EOF);
    return result;
  }

  // ==================== PRECEDENCE LEVEL 1: Assignment ====================

  /**
   * expression := conditional_expression ('=' expression)?
   */
  private eatExpression(): SpelNodeImpl {
    const left = this.eatConditionalExpression();

    // Assignment = lowest precedence, right-associative
    if (this.peek().kind === TokenKind.ASSIGN) {
      const assignToken = this.advance();
      const right = this.eatExpression();
      return new Assign(assignToken.startPos, right.endPos, left, right);
    }

    return left;
  }

  // ==================== PRECEDENCE LEVEL 2: Conditional ====================

  /**
   * conditional_expression := or_expression
   *                           ('?' expression ':' conditional_expression)?
   *                           ('?:' expression)?
   */
  private eatConditionalExpression(): SpelNodeImpl {
    const left = this.eatOrExpression();

    // Elvis: ?: (standalone token, not ? followed by :)
    if (this.peek().kind === TokenKind.ELVIS) {
      const elvisToken = this.advance();
      const right = this.eatConditionalExpression();
      return new Elvis(elvisToken.startPos, right.endPos, left, right);
    }

    // Ternary: ? expr : expr
    if (this.peek().kind === TokenKind.QMARK) {
      this.advance(); // consume '?'

      const trueExpr = this.eatExpression();
      this.expect(TokenKind.COLON);
      const falseExpr = this.eatConditionalExpression();
      return new Ternary(left.startPos, falseExpr.endPos, left, trueExpr, falseExpr);
    }

    return left;
  }

  // ==================== PRECEDENCE LEVEL 3: Logical OR ====================

  /**
   * or_expression := and_expression ('or' / '||' and_expression)*
   */
  private eatOrExpression(): SpelNodeImpl {
    let left = this.eatAndExpression();

    while (this.peek().kind === TokenKind.OR) {
      const opToken = this.advance();
      const right = this.eatAndExpression();
      left = new OpOr('||', opToken.startPos, right.endPos, left, right);
    }

    return left;
  }

  // ==================== PRECEDENCE LEVEL 4: Logical AND ====================

  /**
   * and_expression := relational_expression ('and' / '&&' relational_expression)*
   */
  private eatAndExpression(): SpelNodeImpl {
    let left = this.eatRelationalExpression();

    while (this.peek().kind === TokenKind.AND) {
      const opToken = this.advance();
      const right = this.eatRelationalExpression();
      left = new OpAnd('&&', opToken.startPos, right.endPos, left, right);
    }

    return left;
  }

  // ==================== PRECEDENCE LEVEL 5: Relational ====================

  /**
   * relational_expression := sum_expression
   *     ( '=='/'eq' | '!='/'ne' | '<'/'lt' | '<='/'le'
   *     | '>'/'gt' | '>='/'ge' | 'matches' | 'between' | 'instanceof'
   *     ) sum_expression
   *     | sum_expression 'between' sum_expression 'and' sum_expression
   *     | sum_expression 'instanceof' sum_expression
   */
  private eatRelationalExpression(): SpelNodeImpl {
    const left = this.eatSumExpression();

    // Range operator: a..b
    if (this.peek().kind === TokenKind.DOTDOT) {
      const dotdotToken = this.advance();
      const right = this.eatSumExpression();
      return new RangeOperator(dotdotToken.startPos, right.endPos, left, right);
    }

    const kind = this.peek().kind;
    if (this.isRelationalOp(kind)) {
      const opToken = this.advance();
      const right = this.eatSumExpression();
      return this.buildRelationalOp(opToken, left, right);
    }

    // 'between' has two forms:
    //   1. value between {lower, upper}  (list form)
    //   2. value between lower and upper (and form)
    if (kind === TokenKind.BETWEEN) {
      const betweenToken = this.advance();

      // Check if next is inline list: {lower, upper}
      if (this.peek().kind === TokenKind.LBRACE) {
        const savedPos = this.pos;
        this.advance(); // consume '{'
        if (this.peek().kind !== TokenKind.RBRACE) {
          const lower = this.eatExpression();
          if (this.peek().kind === TokenKind.COMMA) {
            this.advance(); // consume ','
            const upper = this.eatExpression();
            if (this.peek().kind === TokenKind.RBRACE) {
              this.advance(); // consume '}'
              return new OpBetween('between', betweenToken.startPos, this.pos, left, lower, upper);
            }
          }
        }
        // Not a 2-element list — backtrack
        this.pos = savedPos;
      }

      // Form 2: value between lower and upper
      const lower = this.eatSumExpression();
      if (this.peek().kind === TokenKind.AND) {
        this.advance(); // consume 'and'
      }
      const upper = this.eatSumExpression();
      return new OpBetween('between', betweenToken.startPos, upper.endPos, left, lower, upper);
    }

    return left;
  }

  private isRelationalOp(kind: TokenKind): boolean {
    return kind === TokenKind.EQ || kind === TokenKind.NE
      || kind === TokenKind.LT || kind === TokenKind.LE
      || kind === TokenKind.GT || kind === TokenKind.GE
      || kind === TokenKind.MATCHES || kind === TokenKind.INSTANCEOF;
  }

  private buildRelationalOp(opToken: Token, left: SpelNodeImpl, right: SpelNodeImpl): SpelNodeImpl {
    switch (opToken.kind) {
      case TokenKind.EQ: return new OpEQ('==', opToken.startPos, right.endPos, left, right);
      case TokenKind.NE: return new OpNE('!=', opToken.startPos, right.endPos, left, right);
      case TokenKind.LT: return new OpLT('<', opToken.startPos, right.endPos, left, right);
      case TokenKind.LE: return new OpLE('<=', opToken.startPos, right.endPos, left, right);
      case TokenKind.GT: return new OpGT('>', opToken.startPos, right.endPos, left, right);
      case TokenKind.GE: return new OpGE('>=', opToken.startPos, right.endPos, left, right);
      case TokenKind.MATCHES: return new OpMatches('matches', opToken.startPos, right.endPos, left, right);
      case TokenKind.INSTANCEOF: return new OpInstanceof('instanceof', opToken.startPos, right.endPos, left, right);
      default: throw this.raise(SpelMessage.OODES, TokenKind[opToken.kind]);
    }
  }

  // ==================== PRECEDENCE LEVEL 6: Additive ====================

  /**
   * sum_expression := product_expression (('+' | '-') product_expression)*
   */
  private eatSumExpression(): SpelNodeImpl {
    let left = this.eatProductExpression();

    while (this.peek().kind === TokenKind.PLUS || this.peek().kind === TokenKind.MINUS) {
      const opToken = this.advance();
      const right = this.eatProductExpression();
      if (opToken.kind === TokenKind.PLUS) {
        left = new OpPlus('+', opToken.startPos, right.endPos, left, right);
      } else {
        left = new OpMinus('-', opToken.startPos, right.endPos, left, right);
      }
    }

    return left;
  }

  // ==================== PRECEDENCE LEVEL 7: Multiplicative ====================

  /**
   * product_expression := power_expression
   *     (('*' | '/' | '%' | 'mod') power_expression)*
   */
  private eatProductExpression(): SpelNodeImpl {
    let left = this.eatPowerExpression();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const kind = this.peek().kind;
      if (kind !== TokenKind.STAR && kind !== TokenKind.SLASH
        && kind !== TokenKind.PERCENT && kind !== TokenKind.MOD) {
        break;
      }
      const opToken = this.advance();
      const right = this.eatPowerExpression();

      switch (opToken.kind) {
        case TokenKind.STAR: left = new OpMultiply('*', opToken.startPos, right.endPos, left, right); break;
        case TokenKind.SLASH: left = new OpDivide('/', opToken.startPos, right.endPos, left, right); break;
        default: left = new OpModulus('%', opToken.startPos, right.endPos, left, right); break;
      }
    }

    return left;
  }

  // ==================== PRECEDENCE LEVEL 8: Power ====================

  /**
   * power_expression := unary_expression ('^' / '**' power_expression)?
   *
   * Power is right-associative.
   */
  private eatPowerExpression(): SpelNodeImpl {
    const left = this.eatUnaryExpression();

    if (this.peek().kind === TokenKind.POWER) {
      const opToken = this.advance();
      const right = this.eatPowerExpression(); // right-associative
      return new OpPower('^', opToken.startPos, right.endPos, left, right);
    }

    return left;
  }

  // ==================== PRECEDENCE LEVEL 9: Unary ====================

  /**
   * unary_expression := ('-' | '+' | '!' | 'not') unary_expression
   *                    | ('++' | '--') primary_expression
   *                    | primary_expression ('++' | '--')?
   *                    | primary_expression
   */
  private eatUnaryExpression(): SpelNodeImpl {
    const kind = this.peek().kind;

    // Prefix: -expr
    if (kind === TokenKind.MINUS) {
      const opToken = this.advance();
      const operand = this.eatUnaryExpression();
      return new OpMinus('-', opToken.startPos, operand.endPos,
        new NullLiteral(opToken.startPos, opToken.endPos), operand);
    }

    // Prefix: +expr (no-op, just return operand)
    if (kind === TokenKind.PLUS) {
      this.advance();
      return this.eatUnaryExpression();
    }

    // Prefix: !expr / not expr
    if (kind === TokenKind.NOT) {
      const opToken = this.advance();
      const operand = this.eatUnaryExpression();
      return new OpNot('!', opToken.startPos, operand.endPos, operand);
    }

    // Prefix: ++expr
    if (kind === TokenKind.INC) {
      const opToken = this.advance();
      const operand = this.eatUnaryExpression();
      return new OpInc('++', opToken.startPos, operand.endPos, operand);
    }

    // Prefix: --expr
    if (kind === TokenKind.DEC) {
      const opToken = this.advance();
      const operand = this.eatUnaryExpression();
      return new OpDec('--', opToken.startPos, operand.endPos, operand);
    }

    return this.eatPostfixOrPrimary();
  }

  /**
   * 后缀: primary (++ | -- | .identifier | .selector | [index] | (args))
   */
  private eatPostfixOrPrimary(): SpelNodeImpl {
    let node = this.eatPrimaryExpression();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const kind = this.peek().kind;

      // Postfix: expr++
      if (kind === TokenKind.INC) {
        const opToken = this.advance();
        node = new OpInc('++', opToken.startPos, opToken.endPos, node);
        continue;
      }

      // Postfix: expr--
      if (kind === TokenKind.DEC) {
        const opToken = this.advance();
        node = new OpDec('--', opToken.startPos, opToken.endPos, node);
        continue;
      }

      // Property access: expr.identifier / expr.?identifier
      if (kind === TokenKind.DOT || kind === TokenKind.SAFE_NAV
        || kind === TokenKind.SELECTION || kind === TokenKind.PROJECTION
        || kind === TokenKind.SELECT_FIRST || kind === TokenKind.SELECT_LAST) {

        // Handle selection/projection directly as combined tokens (e.g., .?[)
        if (kind === TokenKind.SELECTION || kind === TokenKind.PROJECTION
          || kind === TokenKind.SELECT_FIRST || kind === TokenKind.SELECT_LAST) {
          const selToken = this.advance();
          let predicate: SpelNodeImpl;
          if (this.peek().kind !== TokenKind.RBRACKET) {
            predicate = this.eatExpression();
          } else {
            predicate = new BooleanLiteral(selToken.startPos, selToken.startPos, true);
          }
          this.expect(TokenKind.RBRACKET);

          if (kind === TokenKind.PROJECTION) {
            node = new Projection(selToken.startPos, this.pos, false, node, predicate);
          } else {
            const mode = kind === TokenKind.SELECT_FIRST ? SelectMode.FIRST
              : kind === TokenKind.SELECT_LAST ? SelectMode.LAST
              : SelectMode.ALL;
            node = new Selection(selToken.startPos, this.pos, false, node, predicate, mode);
          }
          continue;
        }

        const dotToken = this.advance();
        const nullSafe = dotToken.kind === TokenKind.SAFE_NAV;
        const nextToken = this.peek();
        if (nextToken.kind === TokenKind.IDENTIFIER) {
          this.advance();
          let nextNode: SpelNodeImpl = new PropertyOrFieldReference(
            nextToken.startPos, nextToken.endPos, nextToken.literal!);
          if (nullSafe && nextNode instanceof PropertyOrFieldReference) {
            nextNode.nullSafe = true;
          }
          // Check for [index] or (args) after property name
          if (this.peek().kind === TokenKind.LBRACKET) {
            this.advance();
            const idx = this.eatExpression();
            this.expect(TokenKind.RBRACKET);
            nextNode = new Indexer(nextNode.startPos, this.pos, nextNode, idx);
          } else if (this.peek().kind === TokenKind.LPAREN) {
            nextNode = this.eatMethodCallForName(nextToken.startPos, nextToken.literal!);
          }
          node = new CompoundExpression(node.startPos, nextNode.endPos, node, nextNode);
          continue;
        }
        // .?[ or .![ or .$[ etc. — selection/projection
        if (nextToken.kind === TokenKind.SELECTION || nextToken.kind === TokenKind.PROJECTION
          || nextToken.kind === TokenKind.SELECT_FIRST || nextToken.kind === TokenKind.SELECT_LAST) {
          const selToken = this.advance();
          // The SELECTION/PROJECTION token already consumed the '.?[' prefix
          // eat predicate up to ']'
          let predicate: SpelNodeImpl;
          if (this.peek().kind !== TokenKind.RBRACKET) {
            predicate = this.eatExpression();
          } else {
            predicate = new BooleanLiteral(nextToken.startPos, nextToken.startPos, true);
          }
          this.expect(TokenKind.RBRACKET);

          if (selToken.kind === TokenKind.PROJECTION) {
            node = new Projection(selToken.startPos, this.pos, false, node, predicate);
          } else {
            const mode = selToken.kind === TokenKind.SELECT_FIRST ? SelectMode.FIRST
              : selToken.kind === TokenKind.SELECT_LAST ? SelectMode.LAST
              : SelectMode.ALL;
            node = new Selection(selToken.startPos, this.pos, false, node, predicate, mode);
          }
          continue;
        }
        throw this.raise(SpelMessage.OODES, 'identifier expected after dot');
      }

      // Indexer: expr[index]
      if (kind === TokenKind.LBRACKET) {
        this.advance();
        const indexExpr = this.eatExpression();
        this.expect(TokenKind.RBRACKET);
        node = new Indexer(node.startPos, this.pos, node, indexExpr);
        continue;
      }

      // Method call: expr(args)
      if (kind === TokenKind.LPAREN) {
        this.advance();
        const args = this.eatExpressionList();
        this.expect(TokenKind.RPAREN);
        // If node is PropertyOrFieldReference, extract name
        if (node instanceof PropertyOrFieldReference) {
          const name = node.toStringAST();
          node = new MethodReference(node.startPos, this.pos, name, ...args);
        } else {
          // Anonymous lambda call or method ref on expression
          node = new MethodReference(node.startPos, this.pos, node.toStringAST(), ...args);
        }
        continue;
      }

      break;
    }

    return node;
  }

  // ==================== PRIMARY ====================

  /**
   * primary_expression := literal | #var | #func() | @bean | T(type)
   *                     | new Type(args) | { ... } | ( expr ) | identifier
   */
  private eatPrimaryExpression(): SpelNodeImpl {
    const token = this.peek();

    switch (token.kind) {
      // Literals
      case TokenKind.LITERAL_NULL:
        this.advance();
        return new NullLiteral(token.startPos, token.endPos);

      case TokenKind.LITERAL_BOOLEAN:
        this.advance();
        return new BooleanLiteral(token.startPos, token.endPos, token.payload as boolean);

      case TokenKind.LITERAL_INT:
        this.advance();
        return new IntLiteral(token.startPos, token.endPos, token.payload as number);

      case TokenKind.LITERAL_LONG:
        this.advance();
        return new LongLiteral(token.startPos, token.endPos, token.payload as number);

      case TokenKind.LITERAL_DOUBLE:
        this.advance();
        return new RealLiteral(token.startPos, token.endPos, token.payload as number);

      case TokenKind.LITERAL_FLOAT:
        this.advance();
        return new FloatLiteral(token.startPos, token.endPos, token.payload as number);

      case TokenKind.LITERAL_STRING:
        this.advance();
        return new StringLiteral(token.startPos, token.endPos, token.payload as string);

      case TokenKind.LITERAL_HEX:
        this.advance();
        return new IntLiteral(token.startPos, token.endPos, token.payload as number);

      // Variable or function: #var or #func(args)
      case TokenKind.HASH: {
        return this.eatVariableOrFunction();
      }

      // Bean reference: @bean or &@factoryBean
      case TokenKind.AT:
      case TokenKind.AMP_AT: {
        return this.eatBeanReference();
      }

      // Grouping: (expr)
      case TokenKind.LPAREN: {
        this.advance();
        const expr = this.eatExpression();
        this.expect(TokenKind.RPAREN);
        return expr;
      }

      // Inline list or map: {a, b, c} or {key: value}
      case TokenKind.LBRACE: {
        return this.eatInlineCollection();
      }

      // Identifier — may be T(type), new, or compound expression
      case TokenKind.IDENTIFIER: {
        return this.eatIdentifierStart();
      }

      case TokenKind.NEW: {
        return this.eatConstructorReference();
      }

      default:
        throw this.raise(SpelMessage.OODES, token.literal!);
    }
  }

  /**
   * Eat identifier-based expressions: identifier | T(type) | new Type
   */
  private eatIdentifierStart(): SpelNodeImpl {
    const token = this.peek();

    if (token.kind !== TokenKind.IDENTIFIER) {
      throw this.raise(SpelMessage.OODES, token.literal!);
    }

    // T(Type) type reference
    if (token.literal === 'T' || token.literal === 't') {
      const savedPos = this.pos;
      this.advance();
      if (this.peek().kind === TokenKind.LPAREN) {
        return this.eatTypeReference();
      }
      // Not T(...), backtrack to normal identifier
      this.pos = savedPos;
    }

    return this.eatCompoundExpression();
  }

  /**
   * Compound expression: identifier (.identifier | .?identifier | [index] | (args) )*
   */
  private eatCompoundExpression(): SpelNodeImpl {
    const startToken = this.peek();
    if (startToken.kind !== TokenKind.IDENTIFIER) {
      throw this.raise(SpelMessage.OODES, startToken.literal!);
    }
    this.advance();

    const startPos = startToken.startPos;
    let node: SpelNodeImpl = new PropertyOrFieldReference(
      startToken.startPos, startToken.endPos, startToken.literal!);

    // Check for method call: name(args)
    if (this.peek().kind === TokenKind.LPAREN) {
      node = this.eatMethodCallForName(startPos, startToken.literal!);
    }

    // Postfix chain: .prop / ?.prop / [index]
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const kind = this.peek().kind;

      if (kind === TokenKind.DOT || kind === TokenKind.SAFE_NAV) {
        const dotToken = this.advance();
        const nullSafe = dotToken.kind === TokenKind.SAFE_NAV;

        const nextToken = this.peek();
        if (nextToken.kind === TokenKind.IDENTIFIER) {
          this.advance();
          let nextNode: SpelNodeImpl = new PropertyOrFieldReference(
            nextToken.startPos, nextToken.endPos, nextToken.literal!);
          if (nullSafe && nextNode instanceof PropertyOrFieldReference) {
            nextNode.nullSafe = true;
          }

          // Check for [index] or (args) after property name
          if (this.peek().kind === TokenKind.LBRACKET) {
            this.advance();
            const idx = this.eatExpression();
            this.expect(TokenKind.RBRACKET);
            nextNode = new Indexer(nextNode.startPos, this.pos, nextNode, idx);
          } else if (this.peek().kind === TokenKind.LPAREN) {
            nextNode = this.eatMethodCallForName(nextToken.startPos, nextToken.literal!);
          }

          node = new CompoundExpression(node.startPos, nextNode.endPos, node, nextNode);
          continue;
        }

        // Selection/Projection: .?[predicate] / .![projection]
        if (nextToken.kind === TokenKind.SELECTION || nextToken.kind === TokenKind.PROJECTION
          || nextToken.kind === TokenKind.SELECT_FIRST || nextToken.kind === TokenKind.SELECT_LAST) {
          const selToken = this.advance();
          this.advance(); // Skip the consumed '['
          // The SELECTION/PROJECTION token already consumed '.?[' — eat predicate up to ']'
          let predicate: SpelNodeImpl;
          if (this.peek().kind !== TokenKind.RBRACKET) {
            predicate = this.eatExpression();
          } else {
            predicate = new BooleanLiteral(nextToken.startPos, nextToken.startPos, true);
          }
          this.expect(TokenKind.RBRACKET);

          if (selToken.kind === TokenKind.PROJECTION) {
            node = new Projection(selToken.startPos, this.pos, false, node, predicate);
          } else {
            const mode = selToken.kind === TokenKind.SELECT_FIRST ? SelectMode.FIRST
              : selToken.kind === TokenKind.SELECT_LAST ? SelectMode.LAST
              : SelectMode.ALL;
            node = new Selection(selToken.startPos, this.pos, false, node, predicate, mode);
          }
          continue;
        }

        throw this.raise(SpelMessage.OODES, 'identifier or selector expected after dot');
      }

      // Indexer after expression: expr[index]
      if (kind === TokenKind.LBRACKET) {
        this.advance();
        const idx = this.eatExpression();
        this.expect(TokenKind.RBRACKET);
        node = new Indexer(node.startPos, this.pos, node, idx);
        continue;
      }

      break;
    }

    return node;
  }

  private eatMethodCallForName(startPos: number, name: string): SpelNodeImpl {
    this.advance(); // consume '('
    const args = this.eatExpressionList();
    this.expect(TokenKind.RPAREN);
    return new MethodReference(startPos, this.pos, name, ...args);
  }

  // ==================== VARIABLE / FUNCTION ====================

  /**
   * #var 或 #func(args)
   */
  private eatVariableOrFunction(): SpelNodeImpl {
    const hashToken = this.advance(); // '#'
    const nameToken = this.expect(TokenKind.IDENTIFIER);
    const name = nameToken.literal!;

    // Function call: #func(arg1, arg2)
    if (this.peek().kind === TokenKind.LPAREN) {
      this.advance();
      const args = this.eatExpressionList();
      this.expect(TokenKind.RPAREN);
      return new MethodReference(hashToken.startPos, this.pos, name, ...args);
    }

    return new VariableReference(hashToken.startPos, nameToken.endPos, name);
  }

  // ==================== BEAN ====================

  /**
   * @bean or &@factoryBean
   */
  private eatBeanReference(): SpelNodeImpl {
    const atToken = this.advance();
    // &@ factory bean prefix
    let isFactoryBean = false;
    if (atToken.kind === TokenKind.AMP_AT) {
      isFactoryBean = true;
    }
    const nameToken = this.expect(TokenKind.IDENTIFIER);

    // Check for method call: @bean.method(args)
    if (this.peek().kind === TokenKind.DOT) {
      this.advance();
      const methodToken = this.expect(TokenKind.IDENTIFIER);
      if (this.peek().kind === TokenKind.LPAREN) {
        this.advance();
        const args = this.eatExpressionList();
        this.expect(TokenKind.RPAREN);
        // Build: #beanRef.name.method => @bean name accessed via bean resolver then method called
        // For Phase 2, return as compound: beanRef.method(args)
        const beanRef = new BeanReference(atToken.startPos, nameToken.endPos, nameToken.literal!, isFactoryBean);
        const methodRef = new MethodReference(methodToken.startPos, this.pos, methodToken.literal!, ...args);
        return new CompoundExpression(atToken.startPos, this.pos, beanRef, methodRef);
      }
      // @bean.property
      const beanRef = new BeanReference(atToken.startPos, nameToken.endPos, nameToken.literal!, isFactoryBean);
      const propRef = new PropertyOrFieldReference(methodToken.startPos, methodToken.endPos, methodToken.literal!);
      return new CompoundExpression(atToken.startPos, this.pos, beanRef, propRef);
    }

    return new BeanReference(atToken.startPos, nameToken.endPos, nameToken.literal!, isFactoryBean);
  }

  // ==================== TYPE ====================

  /**
   * T(Type) 类型引用
   */
  private eatTypeReference(): SpelNodeImpl {
    this.advance(); // consume '(' after T
    const typeName = this.eatQualifiedIdentifier();
    this.expect(TokenKind.RPAREN);
    return new TypeReference(this.pos, this.pos, typeName);
  }

  /**
   * new Type(args...) 构造器引用
   */
  private eatConstructorReference(): SpelNodeImpl {
    const newToken = this.advance(); // consume 'new'
    const typeToken = this.expect(TokenKind.IDENTIFIER);
    // Read qualified type name: java.lang.String
    let className = typeToken.literal!;
    while (this.peek().kind === TokenKind.DOT) {
      this.advance();
      const next = this.advance();
      className += `.${next.literal!}`;
    }

    const args: SpelNodeImpl[] = [];
    if (this.peek().kind === TokenKind.LPAREN) {
      this.advance();
      if (this.peek().kind !== TokenKind.RPAREN) {
        args.push(...this.eatExpressionList());
      }
      this.expect(TokenKind.RPAREN);
    }

    return new ConstructorReference(newToken.startPos, this.pos, className, ...args);
  }

  // ==================== COLLECTION ====================

  /**
   * { expr, expr, ... } or { key: value, key: value, ... }
   */
  private eatInlineCollection(): SpelNodeImpl {
    const start = this.advance().startPos; // consume '{'

    // Empty collection
    if (this.peek().kind === TokenKind.RBRACE) {
      this.advance();
      return new InlineList(start, this.pos);
    }

    const first = this.eatExpression();

    // Map syntax: {key: value, ...}
    if (this.peek().kind === TokenKind.COLON) {
      this.advance(); // consume ':'
      const value = this.eatExpression();
      const entries: SpelNodeImpl[] = [first, value];

      while (this.peek().kind === TokenKind.COMMA) {
        this.advance();
        if (this.peek().kind === TokenKind.RBRACE) break;
        const key = this.eatExpression();
        this.expect(TokenKind.COLON);
        const val = this.eatExpression();
        entries.push(key, val);
      }

      this.expect(TokenKind.RBRACE);
      return new InlineMap(start, this.pos, ...entries);
    }

    // List syntax: {a, b, c}
    const elements: SpelNodeImpl[] = [first];
    while (this.peek().kind === TokenKind.COMMA) {
      this.advance();
      if (this.peek().kind === TokenKind.RBRACE) break;
      elements.push(this.eatExpression());
    }

    this.expect(TokenKind.RBRACE);
    return new InlineList(start, this.pos, ...elements);
  }

  // ==================== HELPERS ====================

  /**
   * 消费逗号分隔的表达式列表
   */
  private eatExpressionList(): SpelNodeImpl[] {
    const args: SpelNodeImpl[] = [];
    if (this.peek().kind !== TokenKind.RPAREN && this.peek().kind !== TokenKind.RBRACKET) {
      args.push(this.eatExpression());
      while (this.peek().kind === TokenKind.COMMA) {
        this.advance();
        if (this.peek().kind === TokenKind.RPAREN || this.peek().kind === TokenKind.RBRACKET) break;
        args.push(this.eatExpression());
      }
    }
    return args;
  }

  /**
   * 消费完整的限定标识符 (java.lang.String)
   */
  private eatQualifiedIdentifier(): string {
    const parts: string[] = [];
    const token = this.advance();
    parts.push(token.literal!);

    while (this.peek().kind === TokenKind.DOT) {
      this.advance();
      const next = this.advance();
      parts.push(next.literal!);
    }

    return parts.join('.');
  }

  // ==================== UTILITY ====================

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
      throw this.raise(SpelMessage.OODES, TokenKind[kind], TokenKind[token.kind]);
    }
    return this.advance();
  }

  private raise(message: SpelMessage, ...args: string[]): SpelParseException {
    return new SpelParseException(this.peek().startPos, message, ...args);
  }
}
