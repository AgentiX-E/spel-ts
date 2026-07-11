/**
 * TokenKind — simplified enum paralleling Spring TokenKind
 *
 * Each token type has one value in this enum.
 * Note: some semantics (e.g. isKeyword) are determined in the Token class directly.
 */
export enum TokenKind {
  // Literals
  LITERAL_INT,
  LITERAL_LONG,
  LITERAL_FLOAT,
  LITERAL_DOUBLE,
  LITERAL_HEX,
  LITERAL_STRING,
  LITERAL_BOOLEAN,
  LITERAL_NULL,

  // Identifiers
  IDENTIFIER,

  // Operators
  PLUS,          // +
  MINUS,         // -
  STAR,          // *
  SLASH,         // /
  PERCENT,       // %
  MOD,           // mod
  POWER,         // ^ or **

  INC,           // ++
  DEC,           // --

  // Comparison/Relational
  EQ,            // == or eq
  NE,            // != or ne
  LT,            // < or lt
  LE,            // <= or le
  GT,            // > or gt
  GE,            // >= or ge

  // Logical
  AND,           // && or and
  OR,            // || or or
  NOT,           // ! or not

  // Assignment
  ASSIGN,        // =

  // Special operators
  MATCHES,       // matches
  BETWEEN,       // between
  INSTANCEOF,    // instanceof

  // Delimiters
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

  // Projection/Selection
  PROJECTION,    // .![
  SELECTION,     // .?[
  SELECT_FIRST,  // .$[ or .^[
  SELECT_LAST,   // .*[

  // Type reference
  TYPE_START,    // T( (internal use)

  // Control
  NEW,           // new
  DOTDOT,        // .. (reserved)

  EOF,
}
