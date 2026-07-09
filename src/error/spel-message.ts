/**
 * 对标 Spring SpelMessage
 *
 * SpEL 错误消息枚举，包含 40+ 条消息定义。
 * 每个条目有唯一的错误码，用于错误定位和国际化。
 */
export enum SpelMessage {
  // ===== 解析错误 (1xxx) =====
  /** 解析意外: 期望 {0} 但得到 {1} */
  OODES = 1001,
  /** 非法字符: {0} */
  NOT_VALID_CHAR = 1002,
  /** 三元缺少冒号 */
  MISSING_TERNARY_COLON = 1003,
  /** 构造器缺少参数 */
  MISSING_CONSTRUCTOR_ARGS = 1004,
  /** 选择缺少表达式 */
  MISSING_SELECTION_EXPRESSION = 1005,
  /** 投影缺少表达式 */
  MISSING_PROJECTION_EXPRESSION = 1006,
  /** 未结束字符串字面量 */
  UNTERMINATED_STRING_LITERAL = 1007,
  /** T() 缺少右括号 */
  TYPE_REFERENCE_MISSING_PAREN = 1008,
  /** .. 后意外数据 */
  UNEXPECTED_DATA_AFTER_DOTDOT = 1009,
  /** 期望变量引用 */
  VARIABLE_REFERENCE_EXPECTED = 1010,

  // ===== 求值错误 (2xxx) =====
  /** 读取属性异常: {0} */
  EXCEPTION_DURING_PROPERTY_READ = 2001,
  /** 属性不可读: {0} */
  PROPERTY_OR_FIELD_NOT_READABLE = 2002,
  /** 属性不可写: {0} */
  PROPERTY_OR_FIELD_NOT_WRITABLE = 2003,
  /** null 上属性不可读: {0} */
  PROPERTY_OR_FIELD_NOT_READABLE_ON_NULL = 2004,
  /** 索引越界 */
  INDEX_OUT_OF_BOUNDS = 2005,
  /** Map 键不存在 */
  MAP_KEY_NOT_FOUND = 2006,
  /** 方法未找到: {0} */
  METHOD_NOT_FOUND = 2007,
  /** 方法调用异常: {0} */
  EXCEPTION_DURING_METHOD_INVOCATION = 2008,
  /** 函数未找到: {0} */
  FUNCTION_NOT_FOUND = 2009,
  /** 变量未找到: {0} */
  VARIABLE_NOT_FOUND = 2010,
  /** 类型未找到: {0} */
  TYPE_NOT_FOUND = 2011,
  /** 构造器未找到: {0} */
  CONSTRUCTOR_NOT_FOUND = 2012,
  /** 构造器调用异常: {0} */
  CONSTRUCTOR_INVOCATION_PROBLEM = 2013,
  /** Bean 未找到: {0} */
  BEAN_NOT_FOUND = 2014,
  /** 操作符不支持类型组合: {0} {1} {2} */
  OPERATOR_NOT_SUPPORTED_BETWEEN_TYPES = 2015,
  /** 不可赋值 */
  NOT_ASSIGNABLE = 2016,
  /** 参数数量不正确 */
  INCORRECT_NUMBER_OF_ARGUMENTS = 2017,
  /** 无法弹出作用域 */
  CANNOT_POP_SCOPE = 2018,
  /** 无法弹出 head index */
  CANNOT_POP_HEAD_INDEX = 2019,
  /** 投影不支持类型: {0} */
  PROJECTION_NOT_SUPPORTED_ON_TYPE = 2020,
  /** 数组索引越界 */
  ARRAY_INDEX_OUT_OF_BOUNDS = 2021,
  /** 类型转换错误 */
  TYPE_CONVERSION_ERROR = 2022,
  /** 方法定位问题 */
  PROBLEM_LOCATING_METHOD = 2023,
  /** 写入属性异常 */
  EXCEPTION_DURING_PROPERTY_WRITE = 2024,
  /** 除零错误 */
  DIVISION_BY_ZERO = 2025,
  /** 操作数不可自增 */
  OPERAND_NOT_INCREMENTABLE = 2026,
  /** 操作数不可自减 */
  OPERAND_NOT_DECREMENTABLE = 2027,
  /** setValue 不支持 */
  SETVALUE_NOT_SUPPORTED = 2028,
  /** 无法编译 */
  CANNOT_COMPILE = 2029,
  /** 构造器未找到 */
  NO_CONSTRUCTOR_FOUND = 2030,
  /** 不是数组 */
  NOT_AN_ARRAY = 2031,
  /** 该类型不支持索引 */
  INDEXING_NOT_SUPPORTED_FOR_TYPE = 2032,
  /** instanceof 不支持 */
  INSTANCEOF_NOT_SUPPORTED = 2033,
  /** between 右操作数错误 */
  BETWEEN_RIGHT_OPERAND = 2034,
  /** 选择条件结果错误 */
  RESULT_OF_SELECTION_CRITERIA = 2035,
  /** 投影不是集合 */
  PROJECTION_NOT_A_COLLECTION = 2036,
  /** 正则匹配失败 */
  MATCHES_REGEX_FAILED = 2037,
  /** 安全导航返回 null */
  SAFE_NAVIGATION_NULL = 2038,
  /** 有缺陷的正则模式 */
  FLAWED_PATTERN = 2039,
}
