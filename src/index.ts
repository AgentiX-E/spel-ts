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

// ===== AST Concrete Nodes =====
export { NullLiteral } from './ast/literal/null-literal.js';
export { BooleanLiteral } from './ast/literal/boolean-literal.js';
export { IntLiteral } from './ast/literal/int-literal.js';
export { LongLiteral } from './ast/literal/long-literal.js';
export { RealLiteral } from './ast/literal/real-literal.js';
export { FloatLiteral } from './ast/literal/float-literal.js';
export { StringLiteral } from './ast/literal/string-literal.js';

export { VariableReference } from './ast/reference/variable-reference.js';
export { PropertyOrFieldReference } from './ast/reference/property-or-field-reference.js';
export { CompoundExpression } from './ast/reference/compound-expression.js';
export { Indexer } from './ast/reference/indexer.js';
export { MethodReference } from './ast/reference/method-reference.js';
export { ConstructorReference } from './ast/reference/constructor-reference.js';
export { BeanReference } from './ast/reference/bean-reference.js';
export { TypeReference } from './ast/reference/type-reference.js';
export { Identifier } from './ast/reference/identifier.js';

export { Ternary } from './ast/control-flow/ternary.js';
export { Elvis } from './ast/control-flow/elvis.js';
export { Assign } from './ast/control-flow/assign.js';

export { InlineList } from './ast/collection/inline-list.js';
export { InlineMap } from './ast/collection/inline-map.js';
export { Selection, SelectMode } from './ast/collection/selection.js';
export { Projection } from './ast/collection/projection.js';

export { OpPlus } from './ast/operator/op-plus.js';
export { OpMinus } from './ast/operator/op-minus.js';
export { OpMultiply } from './ast/operator/op-multiply.js';
export { OpDivide } from './ast/operator/op-divide.js';
export { OpModulus } from './ast/operator/op-modulus.js';
export { OpPower } from './ast/operator/op-power.js';
export { OpEQ } from './ast/operator/op-eq.js';
export { OpNE } from './ast/operator/op-ne.js';
export { OpLT } from './ast/operator/op-lt.js';
export { OpLE } from './ast/operator/op-le.js';
export { OpGT } from './ast/operator/op-gt.js';
export { OpGE } from './ast/operator/op-ge.js';
export { OpAnd } from './ast/operator/op-and.js';
export { OpOr } from './ast/operator/op-or.js';
export { OpNot } from './ast/operator/op-not.js';
export { OpMatches } from './ast/operator/op-matches.js';
export { OpBetween } from './ast/operator/op-between.js';
export { OpInstanceof } from './ast/operator/op-instanceof.js';
export { OpInc } from './ast/operator/op-inc.js';
export { OpDec } from './ast/operator/op-dec.js';
export { RangeOperator } from './ast/operator/range-operator.js';

// ===== Language Infrastructure =====

// — NodeType —
export { NodeType } from './language/node-type.js';

// — SpelEvaluator interface & types —
export type {
  SpelEvaluator, ParseResult, ParseError,
} from './language/spel-evaluator.js';

// — ContextSchema types —
export type {
  ContextSchema, RootObjectSchema, FieldSchema,
  VariableSchema, BeanSchema, TypeSchema,
  MethodSchema, FunctionSchema,
} from './types/context-schema.js';

// — References —
export { SpelReferenceKind } from './language/reference-extractor.js';
export type { SpelReference } from './language/reference-extractor.js';
export { SpelReferenceExtractor } from './language/reference-extractor.js';

// — Diagnostics —
export { DiagnosticSeverity, DiagnosticSource } from './language/diagnostic-engine.js';
export type { SpelDiagnostic, ContextValidationResult } from './language/diagnostic-engine.js';
export { SpelDiagnosticEngine } from './language/diagnostic-engine.js';

// — Completions —
export { CompletionKind } from './language/completion-engine.js';
export type { CompletionItem } from './language/completion-engine.js';
export { SpelCompletionEngine } from './language/completion-engine.js';

// — Formatting —
export type { FormatOptions } from './language/spel-formatter.js';
export { SpelFormatter } from './language/spel-formatter.js';

// — AST Walker —
export type { AstVisitor } from './language/ast-walker.js';
export { AstWalker } from './language/ast-walker.js';

// — SpelEvaluator Adapter —
export { SpelEvaluatorAdapter } from './language/spel-evaluator-adapter.js';
