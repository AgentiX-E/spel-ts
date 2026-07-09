// ===== 核心 API =====
export { TypedValue } from './typed-value.js';

// ===== 错误 =====
export { SpelMessage } from './error/spel-message.js';
export { SpelParseException } from './error/spel-parse-exception.js';
export { SpelEvaluationException } from './error/spel-evaluation-exception.js';

// ===== 配置 =====
export { SpelParserConfiguration } from './spel-parser-configuration.js';

// ===== 工具 =====
export { LRUCache } from './util/lru-cache.js';

// ===== 求值上下文 =====
export type { EvaluationContext } from './evaluation-context/evaluation-context.js';
export type { PropertyAccessor } from './evaluation-context/property-accessor.js';
export type { MethodResolver } from './evaluation-context/method-resolver.js';

// ===== 类型系统 =====
export type { TypeDescriptor } from './type/type-descriptor.js';
export type { TypeLocator } from './type/type-locator.js';

// ===== Bean 系统 =====
export type { BeanResolver } from './bean/bean-resolver.js';

// ===== 桥接层 =====
export { SpelTypeConverter } from './bridge/type-coercion.js';

// ===== 词法分析 =====
export { CharFlag, getCharFlag, isLetter, isDigit, isHexDigit, isWhitespace, isOperator, isQuote, isIdentifierStart, isIdentifierPart } from './tokenizer/char-flags.js';
