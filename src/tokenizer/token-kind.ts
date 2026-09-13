/**
 * TokenKind — simplified enum paralleling Spring TokenKind
 *
 * Each token type has one value in this enum.
 * Note: some semantics (e.g. isKeyword) are determined in the Token class directly.
 *
 * Every member carries an explicit ordinal. The enum is published, and TypeScript
 * compiles a numeric enum into a runtime object with a reverse map, so the ordinals
 * are part of the shipped ABI: a consumer that stores one, or reads `TokenKind[14]`,
 * observes them. A member declared without a value takes "one more than the previous
 * member", which silently renumbers every member after it — adding `DIV` among the
 * operators did exactly that, moving `MOD` from 14 to 15 and `EOF` from 53 to 54
 * between the published 1.2.2 and the 2.0.0 candidate. The values are therefore
 * written out, and `tests/unit/token-kind-stability.test.ts` pins the whole table so
 * that a future insertion cannot renumber the enum again.
 */
export enum TokenKind {
  // Literals
  LITERAL_INT = 0,
  LITERAL_LONG = 1,
  LITERAL_FLOAT = 2,
  LITERAL_DOUBLE = 3,
  LITERAL_HEX = 4,
  LITERAL_STRING = 5,
  LITERAL_BOOLEAN = 6,
  LITERAL_NULL = 7,

  // Identifiers
  IDENTIFIER = 8,

  // Operators
  PLUS = 9, // +
  MINUS = 10, // -
  STAR = 11, // *
  SLASH = 12, // /
  PERCENT = 13, // %
  DIV = 14, // div (textual form, listed in Spring's ALTERNATIVE_OPERATOR_NAMES)
  MOD = 15, // mod
  POWER = 16, // ^ or **

  INC = 17, // ++
  DEC = 18, // --

  // Comparison/Relational
  EQ = 19, // == or eq
  NE = 20, // != or ne
  LT = 21, // < or lt
  LE = 22, // <= or le
  GT = 23, // > or gt
  GE = 24, // >= or ge

  // Logical
  AND = 25, // && or and
  OR = 26, // || or or
  NOT = 27, // ! or not

  // Assignment
  ASSIGN = 28, // =

  // Special operators
  MATCHES = 29, // matches
  BETWEEN = 30, // between
  INSTANCEOF = 31, // instanceof

  // Delimiters
  LPAREN = 32, // (
  RPAREN = 33, // )
  LBRACKET = 34, // [
  RBRACKET = 35, // ]
  LBRACE = 36, // {
  RBRACE = 37, // }
  COMMA = 38, // ,
  COLON = 39, // :
  DOT = 40, // .
  SAFE_NAV = 41, // ?.
  QMARK = 42, // ?
  ELVIS = 43, // ?:
  HASH = 44, // #
  AT = 45, // @
  AMP_AT = 46, // &@

  // Projection/Selection
  PROJECTION = 47, // .![
  SELECTION = 48, // .?[
  SELECT_FIRST = 49, // .$[ or .^[
  SELECT_LAST = 50, // .*[

  // Type reference
  TYPE_START = 51, // T( (internal use)

  // Control
  NEW = 52, // new
  DOTDOT = 53, // .. (reserved)

  EOF = 54,
}
