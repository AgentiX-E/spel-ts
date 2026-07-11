// ===== Core API =====
export { TypedValue } from './typed-value.js';
export { SpelExpressionParser } from './spel-expression-parser.js';
export { SpelExpression } from './spel-expression.js';
export { StandardEvaluationContext } from './standard-evaluation-context.js';
export { SpelParserConfiguration } from './spel-parser-configuration.js';

// ===== Errors =====
export { SpelMessage } from './error/spel-message.js';
export { SpelParseException } from './error/spel-parse-exception.js';
export { SpelEvaluationException } from './error/spel-evaluation-exception.js';

// ===== Utilities =====
export { LRUCache } from './util/lru-cache.js';

// ===== Evaluation Context =====
export type { EvaluationContext } from './evaluation-context/evaluation-context.js';
export type { PropertyAccessor } from './evaluation-context/property-accessor.js';
export type { MethodResolver } from './evaluation-context/method-resolver.js';
export { MapAccessor } from './evaluation-context/map-accessor.js';
export { ArrayAccessor } from './evaluation-context/array-accessor.js';
export { ReflectivePropertyAccessor } from './evaluation-context/reflective-property-accessor.js';
export { TypeDescriptorAccessor } from './evaluation-context/type-descriptor-accessor.js';
export { ReflectiveMethodResolver } from './evaluation-context/reflective-method-resolver.js';

// ===== Type System =====
export type { TypeDescriptor } from './type/type-descriptor.js';
export type { TypeLocator } from './type/type-locator.js';
export { StandardTypeLocator } from './type/standard-type-locator.js';

// ===== Bean System =====
export type { BeanResolver } from './bean/bean-resolver.js';
export { DefaultBeanResolver } from './bean/default-bean-resolver.js';

// ===== Bridge Layer =====
export { SpelTypeConverter } from './bridge/type-coercion.js';

// ===== Lexical Analysis =====
export { CharFlag, getCharFlag, isLetter, isDigit, isHexDigit, isWhitespace, isOperator, isQuote, isIdentifierStart, isIdentifierPart } from './tokenizer/char-flags.js';
export { TokenKind } from './tokenizer/token-kind.js';
export { Token } from './tokenizer/token.js';
export { Tokenizer } from './tokenizer/tokenizer.js';

// ===== AST Nodes (advanced usage) =====
export { SpelNodeImpl, Literal, Operator } from './ast/spel-node.js';
