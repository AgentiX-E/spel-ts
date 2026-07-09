/**
 * TokenKind — 对标 Spring TokenKind 的简化枚举
 *
 * 每个 Token 类型在此枚举中有一个值。
 * 注意：部分语义（如 isKeyword）直接在 Token 类中判定。
 */
export enum TokenKind {
  // 字面量
  LITERAL_INT,
  LITERAL_LONG,
  LITERAL_FLOAT,
  LITERAL_DOUBLE,
  LITERAL_HEX,
  LITERAL_STRING,
  LITERAL_BOOLEAN,
  LITERAL_NULL,

  // 标识符
  IDENTIFIER,

  // 运算符
  PLUS,          // +
  MINUS,         // -
  STAR,          // *
  SLASH,         // /
  PERCENT,       // %
  MOD,           // mod
  POWER,         // ^ 或 **

  INC,           // ++
  DEC,           // --

  // 比较/关系
  EQ,            // == 或 eq
  NE,            // != 或 ne
  LT,            // < 或 lt
  LE,            // <= 或 le
  GT,            // > 或 gt
  GE,            // >= 或 ge

  // 逻辑
  AND,           // && 或 and
  OR,            // || 或 or
  NOT,           // ! 或 not

  // 赋值
  ASSIGN,        // =

  // 特殊运算符
  MATCHES,       // matches
  BETWEEN,       // between
  INSTANCEOF,    // instanceof

  // 分隔符
  LPAREN,        // (
  RPAREN,        // )
  LBRACKET,      // [
  RBRACKET,      // ]
  LBRACE,        // {
  RBRACE,        // }
  COMMA,         // ,
  COLON,         // :
  DOT,           // .
  SAFE_NAV,      // ?.
  QMARK,         // ?
  ELVIS,         // ?:
  HASH,          // #
  AT,            // @
  AMP_AT,        // &@

  // 投影/选择
  PROJECTION,    // .![
  SELECTION,     // .?[
  SELECT_FIRST,  // .$[ 或 .^[
  SELECT_LAST,   // .*[

  // 类型引用
  TYPE_START,    // T(  (内部使用)

  // 控制
  NEW,           // new
  DOTDOT,        // .. (保留)

  EOF,
}
