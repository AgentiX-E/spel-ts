/**
 * Parallels Spring SpelMessage
 *
 * SpEL error message enum with 40+ message definitions.
 * Each entry has a unique error code for positioning and i18n.
 */
export enum SpelMessage {
  // ===== Parse Errors (1xxx) =====
  /** Parse error: expected {0} but got {1} */
  OODES = 1001,
  /** Illegal character: {0} */
  NOT_VALID_CHAR = 1002,
  /** Ternary missing colon */
  MISSING_TERNARY_COLON = 1003,
  /** Constructor missing args */
  MISSING_CONSTRUCTOR_ARGS = 1004,
  /** Selection missing expression */
  MISSING_SELECTION_EXPRESSION = 1005,
  /** Projection missing expression */
  MISSING_PROJECTION_EXPRESSION = 1006,
  /** Unterminated string literal */
  UNTERMINATED_STRING_LITERAL = 1007,
  /** T() missing closing paren */
  TYPE_REFERENCE_MISSING_PAREN = 1008,
  /** Unexpected data after .. */
  UNEXPECTED_DATA_AFTER_DOTDOT = 1009,
  /** Expected variable reference */
  VARIABLE_REFERENCE_EXPECTED = 1010,

  // ===== Evaluation Errors (2xxx) =====
  /** Error reading property: {0} */
  EXCEPTION_DURING_PROPERTY_READ = 2001,
  /** Property not readable: {0} */
  PROPERTY_OR_FIELD_NOT_READABLE = 2002,
  /** Property not writable: {0} */
  PROPERTY_OR_FIELD_NOT_WRITABLE = 2003,
  /** Property not readable on null: {0} */
  PROPERTY_OR_FIELD_NOT_READABLE_ON_NULL = 2004,
  /** Index out of bounds */
  INDEX_OUT_OF_BOUNDS = 2005,
  /** Map key not found */
  MAP_KEY_NOT_FOUND = 2006,
  /** Method not found: {0} */
  METHOD_NOT_FOUND = 2007,
  /** Exception during method invocation: {0} */
  EXCEPTION_DURING_METHOD_INVOCATION = 2008,
  /** Function not found: {0} */
  FUNCTION_NOT_FOUND = 2009,
  /** Variable not found: {0} */
  VARIABLE_NOT_FOUND = 2010,
  /** Type not found: {0} */
  TYPE_NOT_FOUND = 2011,
  /** Constructor not found: {0} */
  CONSTRUCTOR_NOT_FOUND = 2012,
  /** Constructor invocation problem: {0} */
  CONSTRUCTOR_INVOCATION_PROBLEM = 2013,
  /** Bean not found: {0} */
  BEAN_NOT_FOUND = 2014,
  /** Operator not supported between types: {0} {1} {2} */
  OPERATOR_NOT_SUPPORTED_BETWEEN_TYPES = 2015,
  /** Not assignable */
  NOT_ASSIGNABLE = 2016,
  /** Incorrect number of arguments */
  INCORRECT_NUMBER_OF_ARGUMENTS = 2017,
  /** Cannot pop scope */
  CANNOT_POP_SCOPE = 2018,
  /** Cannot pop head index */
  CANNOT_POP_HEAD_INDEX = 2019,
  /** Projection not supported on type: {0} */
  PROJECTION_NOT_SUPPORTED_ON_TYPE = 2020,
  /** Array index out of bounds */
  ARRAY_INDEX_OUT_OF_BOUNDS = 2021,
  /** Type conversion error */
  TYPE_CONVERSION_ERROR = 2022,
  /** Problem locating method */
  PROBLEM_LOCATING_METHOD = 2023,
  /** Exception during property write */
  EXCEPTION_DURING_PROPERTY_WRITE = 2024,
  /** Division by zero */
  DIVISION_BY_ZERO = 2025,
  /** Operand not incrementable */
  OPERAND_NOT_INCREMENTABLE = 2026,
  /** Operand not decrementable */
  OPERAND_NOT_DECREMENTABLE = 2027,
  /** setValue not supported */
  SETVALUE_NOT_SUPPORTED = 2028,
  /** Cannot compile */
  CANNOT_COMPILE = 2029,
  /** No constructor found */
  NO_CONSTRUCTOR_FOUND = 2030,
  /** Not an array */
  NOT_AN_ARRAY = 2031,
  /** Indexing not supported for type */
  INDEXING_NOT_SUPPORTED_FOR_TYPE = 2032,
  /** instanceof not supported */
  INSTANCEOF_NOT_SUPPORTED = 2033,
  /** Between right operand error */
  BETWEEN_RIGHT_OPERAND = 2034,
  /** Result of selection criteria error */
  RESULT_OF_SELECTION_CRITERIA = 2035,
  /** Projection is not a collection */
  PROJECTION_NOT_A_COLLECTION = 2036,
  /** Matches regex failed */
  MATCHES_REGEX_FAILED = 2037,
  /** Safe navigation null */
  SAFE_NAVIGATION_NULL = 2038,
  /** Flawed pattern */
  FLAWED_PATTERN = 2039,
}
