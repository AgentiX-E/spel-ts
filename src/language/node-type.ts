/**
 * NodeType — canonical enumeration of all SpEL AST node kinds.
 *
 * Enables programmatic node type discrimination without instanceof checks.
 * Each AST node carries its NodeType as a public readonly property.
 */
export enum NodeType {
  // ===== Literals =====
  NULL_LITERAL = 'null_literal',
  BOOLEAN_LITERAL = 'boolean_literal',
  INT_LITERAL = 'int_literal',
  LONG_LITERAL = 'long_literal',
  REAL_LITERAL = 'real_literal',
  FLOAT_LITERAL = 'float_literal',
  STRING_LITERAL = 'string_literal',

  // ===== References =====
  VARIABLE_REFERENCE = 'variable_reference',
  PROPERTY_OR_FIELD_REFERENCE = 'property_or_field_reference',
  COMPOUND_EXPRESSION = 'compound_expression',
  INDEXER = 'indexer',
  METHOD_REFERENCE = 'method_reference',
  CONSTRUCTOR_REFERENCE = 'constructor_reference',
  BEAN_REFERENCE = 'bean_reference',
  TYPE_REFERENCE = 'type_reference',
  IDENTIFIER = 'identifier',

  // ===== Control Flow =====
  TERNARY = 'ternary',
  ELVIS = 'elvis',
  ASSIGN = 'assign',

  // ===== Collections =====
  INLINE_LIST = 'inline_list',
  INLINE_MAP = 'inline_map',
  SELECTION = 'selection',
  PROJECTION = 'projection',

  // ===== Operators =====
  OP_PLUS = 'op_plus',
  OP_MINUS = 'op_minus',
  OP_MULTIPLY = 'op_multiply',
  OP_DIVIDE = 'op_divide',
  OP_MODULUS = 'op_modulus',
  OP_POWER = 'op_power',
  OP_EQ = 'op_eq',
  OP_NE = 'op_ne',
  OP_LT = 'op_lt',
  OP_LE = 'op_le',
  OP_GT = 'op_gt',
  OP_GE = 'op_ge',
  OP_AND = 'op_and',
  OP_OR = 'op_or',
  OP_NOT = 'op_not',
  OP_MATCHES = 'op_matches',
  OP_BETWEEN = 'op_between',
  OP_INSTANCEOF = 'op_instanceof',
  OP_INC = 'op_inc',
  OP_DEC = 'op_dec',
  RANGE_OPERATOR = 'range_operator',
}
