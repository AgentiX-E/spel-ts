/**
 * Spring conformance corpus — the executable definition of "correct".
 *
 * This file is pure data: it imports nothing from `src/` and nothing from any
 * test framework, so the same corpus can drive a vitest suite, a `node:test`
 * suite, or the JVM golden generator without modification.
 *
 * Every case carries a `ref` that cites the Spring source of truth for the
 * expectation, so any assertion can be audited back to Spring rather than to
 * this project's own assumptions. That is the whole point: the previous suite
 * measured coverage of its own behaviour and therefore could not detect drift.
 *
 * References used:
 *   - docs  : Spring Framework reference, Core / Expressions / Language reference / Operators
 *   - tok   : org.springframework.expression.spel.standard.Tokenizer
 *   - parser: org.springframework.expression.spel.standard.InternalSpelExpressionParser
 *   - op    : org.springframework.expression.spel.ast.Operator (and subclasses)
 *   - jls   : Java Language Specification, numeric promotion and division
 */

/** What Spring is documented or specified to do with the expression. */
export type Expectation =
  | { readonly kind: 'value'; readonly value: unknown }
  | {
      readonly kind: 'throws';
      readonly errorName: 'SpelParseException' | 'SpelEvaluationException';
    };

export interface ConformanceCase {
  /** Stable, human-readable identifier used in test names. */
  readonly id: string;
  /** Functional grouping, used for reporting divergence deltas per area. */
  readonly group: string;
  /** The SpEL expression under test. */
  readonly expr: string;
  /** Root object, when the expression references properties. */
  readonly root?: Record<string, unknown>;
  /** Variables bound with `#name`, mirroring EvaluationContext#setVariable. */
  readonly variables?: Record<string, unknown>;
  readonly expect: Expectation;
  /** Spring source of truth for this expectation. */
  readonly ref: string;
}

export function value(v: unknown): Expectation {
  return { kind: 'value', value: v };
}

export function throwsParse(): Expectation {
  return { kind: 'throws', errorName: 'SpelParseException' };
}

export function throwsEval(): Expectation {
  return { kind: 'throws', errorName: 'SpelEvaluationException' };
}

interface DraftCase {
  readonly group: string;
  readonly expr: string;
  readonly root?: Record<string, unknown>;
  readonly variables?: Record<string, unknown>;
  readonly expect: Expectation;
  readonly ref: string;
  readonly label?: string;
}

/** Materialise drafts into cases, deriving a stable id from group + label. */
function build(drafts: readonly DraftCase[]): ConformanceCase[] {
  return drafts.map((d, index) => ({
    id: `${d.group}:${d.label ?? index}`,
    group: d.group,
    expr: d.expr,
    root: d.root,
    variables: d.variables,
    expect: d.expect,
    ref: d.ref,
  }));
}

// ---------------------------------------------------------------------------
// Case-form generators
//
// Spring matches textual operators case-insensitively, so every keyword must
// behave identically in every casing. Generating the variants from one table
// proves that systematically instead of by sampling.
// ---------------------------------------------------------------------------

type CaseForm = (word: string) => string;

/** A casing variant: its name, and the transform that produces it. */
type CaseFormEntry = readonly [name: string, form: CaseForm];

const CASE_FORMS: readonly CaseFormEntry[] = [
  ['lower', (w) => w.toLowerCase()],
  ['upper', (w) => w.toUpperCase()],
  ['capitalised', (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()],
  [
    'alternating',
    (w) =>
      w
        .split('')
        .map((ch, i) => (i % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase()))
        .join(''),
  ],
];

/** A table row: the expression, the value Spring produces, and the citation. */
type ValueRow = readonly [expr: string, expected: unknown, ref: string];

interface KeywordTemplate {
  readonly kw: string;
  readonly expr: (word: string) => string;
  readonly value: unknown;
  readonly ref: string;
}

/**
 * One template per textual operator. `div` is included because Spring lists it
 * in ALTERNATIVE_OPERATOR_NAMES; `matches` and `between` are included because
 * the Spring parser resolves them with equalsIgnoreCase.
 */
const KEYWORD_TEMPLATES: readonly KeywordTemplate[] = [
  { kw: 'and', expr: (w) => `true ${w} false`, value: false, ref: 'docs#logical' },
  { kw: 'or', expr: (w) => `true ${w} false`, value: true, ref: 'docs#logical' },
  { kw: 'not', expr: (w) => `${w} true`, value: false, ref: 'tok#ALTERNATIVE_OPERATOR_NAMES' },
  { kw: 'eq', expr: (w) => `2 ${w} 2`, value: true, ref: 'tok#ALTERNATIVE_OPERATOR_NAMES' },
  { kw: 'ne', expr: (w) => `2 ${w} 3`, value: true, ref: 'tok#ALTERNATIVE_OPERATOR_NAMES' },
  { kw: 'lt', expr: (w) => `1 ${w} 2`, value: true, ref: 'tok#ALTERNATIVE_OPERATOR_NAMES' },
  { kw: 'le', expr: (w) => `1 ${w} 1`, value: true, ref: 'tok#ALTERNATIVE_OPERATOR_NAMES' },
  { kw: 'gt', expr: (w) => `3 ${w} 2`, value: true, ref: 'tok#ALTERNATIVE_OPERATOR_NAMES' },
  { kw: 'ge', expr: (w) => `3 ${w} 3`, value: true, ref: 'tok#ALTERNATIVE_OPERATOR_NAMES' },
  { kw: 'mod', expr: (w) => `7 ${w} 4`, value: 3, ref: 'tok#ALTERNATIVE_OPERATOR_NAMES' },
  { kw: 'div', expr: (w) => `6 ${w} 3`, value: 2, ref: 'tok#ALTERNATIVE_OPERATOR_NAMES' },
  {
    kw: 'matches',
    expr: (w) => `'5.00' ${w} '^-?\\d+(\\.\\d{2})?$'`,
    value: true,
    ref: 'parser#peekIdentifierToken',
  },
  { kw: 'between', expr: (w) => `1 ${w} {1, 5}`, value: true, ref: 'parser#peekIdentifierToken' },
];

function keywordCases(): DraftCase[] {
  const out: DraftCase[] = [];
  for (const tpl of KEYWORD_TEMPLATES) {
    for (const [formName, form] of CASE_FORMS) {
      const word = form(tpl.kw);
      out.push({
        group: 'keyword-case',
        label: `${tpl.kw}-${formName}`,
        expr: tpl.expr(word),
        expect: value(tpl.value),
        ref: tpl.ref,
      });
    }
  }
  return out;
}

/** Literal keywords, resolved by the Spring parser with equalsIgnoreCase. */
function literalKeywordCases(): DraftCase[] {
  const literals: readonly ValueRow[] = [
    ['true', true, 'parser#eatPrimaryExpression'],
    ['false', false, 'parser#eatPrimaryExpression'],
    ['null', null, 'parser#eatPrimaryExpression'],
  ];
  const out: DraftCase[] = [];
  for (const [word, val, ref] of literals) {
    for (const [formName, form] of CASE_FORMS) {
      out.push({
        group: 'literal-keyword-case',
        label: `${word}-${formName}`,
        expr: form(word),
        expect: value(val),
        ref,
      });
    }
  }
  return out;
}

/**
 * Identifiers that merely *begin* with a keyword must still lex as identifiers.
 * These guard against a prefix-matching implementation, and they matter because
 * real schemas contain names like `order`, `notes` and `division`.
 */
function keywordPrefixCases(): DraftCase[] {
  return [
    {
      group: 'keyword-prefix',
      label: 'android',
      expr: 'android == 1',
      root: { android: 1 },
      expect: value(true),
      ref: 'tok#lexIdentifier (whole-token match only)',
    },
    {
      group: 'keyword-prefix',
      label: 'order',
      expr: 'order > 3',
      root: { order: 5 },
      expect: value(true),
      ref: 'tok#lexIdentifier (whole-token match only)',
    },
    {
      group: 'keyword-prefix',
      label: 'division',
      expr: 'division == 4',
      root: { division: 4 },
      expect: value(true),
      ref: 'tok#lexIdentifier (whole-token match only)',
    },
    {
      group: 'keyword-prefix',
      label: 'notable',
      expr: 'notable == 2',
      root: { notable: 2 },
      expect: value(true),
      ref: 'tok#lexIdentifier (whole-token match only)',
    },
    {
      group: 'keyword-prefix',
      label: 'nullifier',
      expr: 'nullifier == 7',
      root: { nullifier: 7 },
      expect: value(true),
      ref: 'tok#lexIdentifier (whole-token match only)',
    },
  ];
}

/**
 * Spring accepts any Character.isLetter, so identifiers may contain non-ASCII
 * letters. This is load-bearing for the Chinese natural-language pipeline,
 * which produces field names such as `年龄` and `姓名`.
 */
function unicodeIdentifierCases(): DraftCase[] {
  return [
    {
      group: 'unicode-identifier',
      label: 'cjk-property',
      expr: '年龄 > 18',
      root: { 年龄: 20 },
      expect: value(true),
      ref: 'tok#isAlphabetic -> Character.isLetter',
    },
    {
      group: 'unicode-identifier',
      label: 'cjk-null-check',
      expr: '姓名 != null',
      root: { 姓名: 'Zhang' },
      expect: value(true),
      ref: 'tok#isAlphabetic -> Character.isLetter',
    },
    {
      group: 'unicode-identifier',
      label: 'cjk-nested',
      expr: '订单.金额 >= 100',
      root: { 订单: { 金额: 150 } },
      expect: value(true),
      ref: 'tok#isAlphabetic -> Character.isLetter',
    },
    {
      group: 'unicode-identifier',
      label: 'accented-latin',
      expr: 'café.prix == 3',
      root: { café: { prix: 3 } },
      expect: value(true),
      ref: 'tok#isAlphabetic -> Character.isLetter',
    },
    {
      group: 'unicode-identifier',
      label: 'greek',
      expr: 'αβγ == 1',
      root: { αβγ: 1 },
      expect: value(true),
      ref: 'tok#isAlphabetic -> Character.isLetter',
    },
    {
      group: 'unicode-identifier',
      label: 'rejects-currency-symbol',
      expr: '€',
      expect: throwsParse(),
      ref: 'tok#process default -> UNSUPPORTED_CHARACTER',
    },
    {
      group: 'unicode-identifier',
      label: 'rejects-emoji',
      expr: 'a😀',
      expect: throwsParse(),
      ref: 'tok#process default -> UNSUPPORTED_CHARACTER',
    },
    {
      group: 'unicode-identifier',
      label: 'rejects-fullwidth-digit-as-identifier-start',
      expr: '１ == 1',
      expect: throwsParse(),
      ref: 'tok#isDigit is ASCII-only (FLAGS table, 256 entries)',
    },
  ];
}

/**
 * Java binary numeric promotion. Integer division truncates toward zero and
 * integer arithmetic wraps at 32 bits; only a floating operand yields a float.
 */
function numericTowerCases(): DraftCase[] {
  const numeric: readonly ValueRow[] = [
    ['8 / 5', 1, 'jls 15.17.2 integer division'],
    ['7 / 2', 3, 'jls 15.17.2 integer division'],
    ['-7 / 2', -3, 'jls 15.17.2 truncate toward zero'],
    ['7 / -2', -3, 'jls 15.17.2 truncate toward zero'],
    ['1 / 3', 0, 'jls 15.17.2 integer division'],
    ['10 / 4', 2, 'jls 15.17.2 integer division'],
    ['8 / 5 % 2', 1, 'jls 15.17.2 with promotion through the expression'],
    ['5 / 2 * 2', 4, 'jls 15.17.2'],
    ['8.0 / 5', 1.6, 'jls 15.17.2 double promotion'],
    ['8 / 5.0', 1.6, 'jls 15.17.2 double promotion'],
    ['7 % 4', 3, 'jls 15.17.3'],
    ['-7 % 3', -1, 'jls 15.17.3 sign follows dividend'],
    ['7 % -3', 1, 'jls 15.17.3 sign follows dividend'],
    ['1 + 2 - 3 * 8', -21, 'docs#mathematical precedence'],
    ['2 ^ 3', 8, 'docs#mathematical'],
    ['0.1 + 0.2', 0.30000000000000004, 'IEEE-754 double addition'],
    ['2147483647 + 1', -2147483648, 'jls 15.18.2 32-bit wrap'],
    ['-2 * -3', 6, 'jls 15.17.1'],
  ];
  return numeric.map(([expr, val, ref]) => ({
    group: 'numeric-tower',
    label: expr,
    expr,
    expect: value(val),
    ref,
  }));
}

/**
 * Spring's OperatorAnd / OperatorOr / OperatorNot coerce operands to Boolean
 * and throw when the value is not convertible, rather than applying JavaScript
 * truthiness.
 */
function logicalOperandCases(): DraftCase[] {
  return [
    {
      group: 'logical-typing',
      label: 'and-number',
      expr: 'true and 5',
      expect: throwsEval(),
      ref: 'op#OperatorAnd',
    },
    {
      group: 'logical-typing',
      label: 'or-string',
      expr: "'a' or false",
      expect: throwsEval(),
      ref: 'op#OperatorOr',
    },
    {
      group: 'logical-typing',
      label: 'and-null',
      expr: 'null and true',
      expect: throwsEval(),
      ref: 'op#OperatorAnd',
    },
    {
      group: 'logical-typing',
      label: 'not-number',
      expr: 'not 5',
      expect: throwsEval(),
      ref: 'op#OperatorNot',
    },
    {
      group: 'logical-typing',
      label: 'and-numbers',
      expr: '1 and 1',
      expect: throwsEval(),
      ref: 'op#OperatorAnd',
    },
    {
      group: 'logical-typing',
      label: 'short-circuit-still-applies',
      expr: 'false and (1 / 0 == 1)',
      expect: value(false),
      ref: 'op#OperatorAnd short-circuits on the left operand',
    },
    {
      group: 'logical-typing',
      label: 'or-short-circuit',
      expr: 'true or (1 / 0 == 1)',
      expect: value(true),
      ref: 'op#OperatorOr short-circuits on the left operand',
    },
  ];
}

/** Operator.equalityCheck never coerces a String to a Number. */
function equalityCases(): DraftCase[] {
  const eq: readonly ValueRow[] = [
    ["'1' == 1", false, 'op#equalityCheck'],
    ['true == 1', false, 'op#equalityCheck'],
    ['null == 0', false, 'op#equalityCheck'],
    ['null == null', true, 'op#equalityCheck'],
    ["'abc' == 'abc'", true, 'op#equalityCheck'],
    ['1 == 1', true, 'op#equalityCheck'],
    ['1.0 == 1', true, 'op#equalityCheck numeric promotion'],
    ["1 != '1'", true, 'op#equalityCheck'],
    ['true == true', true, 'op#equalityCheck'],
    ['false == false', true, 'op#equalityCheck'],
    ['true != false', true, 'op#equalityCheck'],
    ['false == 0', false, 'op#equalityCheck Boolean vs Number'],
  ];
  return eq.map(([expr, val, ref]) => ({
    group: 'equality',
    label: expr,
    expr,
    expect: value(val),
    ref,
  }));
}

/** Constructs the engine must reject, because Spring rejects them. */
function strictnessCases(): DraftCase[] {
  return [
    {
      group: 'grammar-strictness',
      label: 'between-requires-list',
      expr: '1 between 1 and 5',
      expect: throwsParse(),
      ref: 'docs#operators between {min, max}',
    },
    {
      group: 'grammar-strictness',
      label: 'double-star-is-not-power',
      expr: '2 ** 3',
      expect: throwsParse(),
      ref: "tok#process '*' is a single STAR; '^' is POWER",
    },
    {
      group: 'grammar-strictness',
      label: 'assignment-not-chainable',
      expr: '#a = #b = 1',
      root: { a: 0, b: 0 },
      expect: throwsParse(),
      ref: 'parser#eatExpression binds the right-hand side at logical-or precedence',
    },
    {
      group: 'grammar-strictness',
      label: 'between-list-must-be-ordered',
      expr: '1 between {5, 1}',
      expect: value(false),
      ref: 'docs#operators between is a shortcut for >= lower && <= upper',
    },
    {
      group: 'grammar-strictness',
      label: 'rejects-star-bracket-selection',
      expr: 'items.*[price > 20]',
      root: { items: [] },
      expect: throwsParse(),
      ref: "tok#process has no '.*[' modifier; only '^[' and '$[' exist",
    },
  ];
}

function divisionByZeroCases(): DraftCase[] {
  return [
    {
      group: 'division-by-zero',
      label: 'int-div-zero',
      expr: '1 / 0',
      expect: throwsEval(),
      ref: 'jls 15.17.2 ArithmeticException',
    },
    {
      group: 'division-by-zero',
      label: 'int-mod-zero',
      expr: '1 % 0',
      expect: throwsEval(),
      ref: 'jls 15.17.3 ArithmeticException',
    },
    {
      group: 'division-by-zero',
      label: 'double-div-zero',
      expr: '1.0 / 0.0',
      expect: value(Number.POSITIVE_INFINITY),
      ref: 'jls 15.17.2 IEEE-754 yields Infinity',
    },
  ];
}

/** Baseline behaviour that already conforms; these must never regress. */
function baselineCases(): DraftCase[] {
  const baseline: readonly ValueRow[] = [
    ['1 + 2 * 3', 7, 'docs#mathematical precedence'],
    ["'it''s'", "it's", 'tok#lexQuotedStringLiteral doubled quote escapes'],
    ['"a""b"', 'a"b', 'tok#lexDoubleQuotedStringLiteral'],
    ["null ?: 'fallback'", 'fallback', 'docs#elvis'],
    ["true ? 'a' : 'b'", 'a', 'docs#ternary'],
    ['null?.foo', null, 'docs#safe-navigation'],
    ['{1,2,3}[0]', 1, 'parser#eatInlineCollection'],
    ["'abc'.length()", 3, 'java.lang.String#length'],
    ["'abc'.substring(1, 3)", 'bc', 'java.lang.String#substring'],
    ["'abc'.toUpperCase()", 'ABC', 'java.lang.String#toUpperCase'],
    ["'abc'.contains('b')", true, 'java.lang.String#contains'],
    ["'  x '.trim()", 'x', 'java.lang.String#trim'],
    ["'a,b'.split(',')[1]", 'b', 'java.lang.String#split'],
    ["'elephant' between {'aardvark', 'zebra'}", true, 'docs#operators'],
    ["'elephant' between {'aardvark', 'cobra'}", false, 'docs#operators'],
    ['1 between {10, 15}', false, 'docs#operators'],
  ];
  return baseline.map(([expr, val, ref]) => ({
    group: 'baseline',
    label: expr,
    expr,
    expect: value(val),
    ref,
  }));
}

/**
 * Java `String` semantics reachable through SpEL method invocation.
 *
 * SpEL resolves these against `java.lang.String`, so the expectations are
 * Java's, not JavaScript's — `matches` tests the entire string against a
 * regular expression and `split` takes a regex, both of which differ subtly
 * from the JavaScript equivalents.
 */
function javaStringMethodCases(): DraftCase[] {
  const cases: readonly ValueRow[] = [
    ["'abc'.matches('a.*')", true, 'java.lang.String#matches (regex, whole-string)'],
    ["'abc'.matches('b')", false, 'java.lang.String#matches (whole-string, not substring)'],
    ["'abc'.isEmpty()", false, 'java.lang.String#isEmpty'],
    ["''.isEmpty()", true, 'java.lang.String#isEmpty'],
    ["'abc'.charAt(1)", 'b', 'java.lang.String#charAt'],
    ["'abc'.endsWith('c')", true, 'java.lang.String#endsWith'],
    ["'abc'.startsWith('ab')", true, 'java.lang.String#startsWith'],
    ["'abc'.equalsIgnoreCase('ABC')", true, 'java.lang.String#equalsIgnoreCase'],
    // replace replaces every occurrence in Java; JavaScript replaces only the
    // first, so the JavaScript implementation used to win and diverge here.
    ["'aXbXc'.replace('X', '-')", 'a-b-c', 'java.lang.String#replace replaces all occurrences'],
    // split takes a regular expression in Java and drops trailing empty strings.
    ["'a1b2'.split('\\d')", ['a', 'b'], 'java.lang.String#split takes a regex'],
    ["'a,b,'.split(',')", ['a', 'b'], 'java.lang.String#split drops trailing empty strings'],
    [
      "'a,b,'.split(',', -1)",
      ['a', 'b', ''],
      'java.lang.String#split keeps all for a negative limit',
    ],
    ["'a,b,c'.split(',', 2)", ['a', 'b,c'], 'java.lang.String#split limit holds the remainder'],
    ["'abc'.replaceFirst('b', 'z')", 'azc', 'java.lang.String#replaceFirst'],
    ["'abc'.compareTo('abd')", -1, 'java.lang.String#compareTo'],
    ["'  '.isBlank()", true, 'java.lang.String#isBlank'],
    ["'abc'.indexOf('c')", 2, 'java.lang.String#indexOf'],
    ["'abcabc'.lastIndexOf('c')", 5, 'java.lang.String#lastIndexOf'],
    ["'abc'.concat('de')", 'abcde', 'java.lang.String#concat'],
    ["'abc'.replace('b', 'z')", 'azc', 'java.lang.String#replace'],
    ["'a1b2'.replaceAll('\\d', '-')", 'a-b-', 'java.lang.String#replaceAll (regex)'],
    ["'abc'.toLowerCase()", 'abc', 'java.lang.String#toLowerCase'],
    ["'ABC'.toLowerCase()", 'abc', 'java.lang.String#toLowerCase'],
  ];
  return cases.map(([expr, val, ref]) => ({
    group: 'java-string-methods',
    label: expr,
    expr,
    expect: value(val),
    ref,
  }));
}

function propertyAndCollectionCases(): DraftCase[] {
  const items = [
    { name: 'a', price: 10 },
    { name: 'b', price: 200 },
    { name: 'c', price: 30 },
  ];
  return [
    {
      group: 'property-access',
      label: 'root-property',
      expr: 'age >= 18',
      root: { age: 20 },
      expect: value(true),
      ref: 'parser#eatCompoundExpression',
    },
    {
      group: 'property-access',
      label: 'nested-property',
      expr: 'user.name',
      root: { user: { name: 'Alice' } },
      expect: value('Alice'),
      ref: 'parser#eatCompoundExpression',
    },
    {
      group: 'property-access',
      label: 'root-prefix',
      expr: '#root.age',
      root: { age: 20 },
      expect: value(20),
      ref: 'docs#root object',
    },
    {
      group: 'collections',
      label: 'selection',
      expr: 'items.?[price > 20]',
      root: { items },
      expect: value([
        { name: 'b', price: 200 },
        { name: 'c', price: 30 },
      ]),
      ref: 'docs#collection-selection',
    },
    {
      group: 'collections',
      label: 'projection',
      expr: 'items.![name]',
      root: { items },
      expect: value(['a', 'b', 'c']),
      ref: 'docs#collection-projection',
    },
    {
      group: 'collections',
      label: 'select-first',
      expr: 'items.^[price > 20]',
      root: { items },
      expect: value({ name: 'b', price: 200 }),
      ref: 'docs#collection-selection',
    },
    {
      group: 'collections',
      label: 'select-last',
      expr: 'items.$[price > 20]',
      root: { items },
      expect: value({ name: 'c', price: 30 }),
      ref: 'docs#collection-selection',
    },
  ];
}

/**
 * The full corpus. Order is stable and grouped so that divergence reports can
 * be diffed between runs.
 */
/**
 * Explicit literal suffixes and the promotions they trigger, so that float and
 * long arithmetic is exercised end to end rather than only through unit tests.
 */
function numericKindCases(): DraftCase[] {
  const cases: readonly ValueRow[] = [
    ['5.0f + 1.0f', 6, 'jls 5.6.2 promotion to float'],
    ['1.5f * 2.0f', 3, 'jls 5.6.2 promotion to float'],
    ['2L * 3L', 6, 'jls 5.6.2 promotion to long'],
    ['7L / 2L', 3, 'jls 15.17.2 long division truncates'],
    ['10L % 3L', 1, 'jls 15.17.3 long remainder'],
    ['2 + 3L', 5, 'jls 5.6.2 widening to long'],
    ['2 + 3.0', 5, 'jls 5.6.2 widening to double'],
    ['-3L', -3, 'unary minus preserves the numeric kind'],
  ];
  return cases.map(([expr, val, ref]) => ({
    group: 'numeric-kinds',
    label: expr,
    expr,
    expect: value(val),
    ref,
  }));
}

/**
 * Arithmetic operands that are not numbers.
 *
 * Spring raises a type-conversion error rather than coercing, so `'a' - 1`
 * fails instead of quietly producing NaN.
 */
function operandTypingCases(): DraftCase[] {
  return [
    {
      group: 'operand-typing',
      label: 'string-minus-number',
      expr: "'a' - 1",
      expect: throwsEval(),
      ref: 'op#OperatorMinus operates on numbers',
    },
    {
      group: 'operand-typing',
      label: 'string-times-number',
      expr: "'a' * 2",
      expect: throwsEval(),
      ref: 'op#OperatorMultiply operates on numbers',
    },
  ];
}

/**
 * Long literals are parsed with parseInt, so magnitudes above 2^53 lose
 * precision at the lexer, before evaluation ever runs. Spring keeps a 64-bit
 * value exactly. Recorded as a known divergence rather than silently accepted.
 */
function longPrecisionCases(): DraftCase[] {
  const cases: readonly ValueRow[] = [
    // A BigInt literal, because 9007199254740993 is not representable as a
    // JavaScript number and would otherwise round in this very file.
    ['9007199254740993L', 9007199254740993n, 'jls 3.10.1 long literals are exact'],
  ];
  return cases.map(([expr, val, ref]) => ({
    group: 'long-precision',
    label: expr,
    expr,
    expect: value(val),
    ref,
  }));
}

/**
 * String method calls that must report an error rather than return a
 * plausible-looking value.
 *
 * Java's String rejects an out-of-range index, and it has no `includes` or
 * `padStart`, so a name the JavaScript implementation happens to provide must
 * not resolve.
 */
function javaStringErrorCases(): DraftCase[] {
  return [
    {
      group: 'java-string-methods',
      label: 'charAt-out-of-range',
      expr: 's.charAt(10)',
      root: { s: 'abc' },
      expect: throwsEval(),
      ref: 'java.lang.String#charAt throws StringIndexOutOfBoundsException',
    },
    {
      group: 'java-string-methods',
      label: 'substring-beyond-end',
      expr: 's.substring(0, 10)',
      root: { s: 'abc' },
      expect: throwsEval(),
      ref: 'java.lang.String#substring throws StringIndexOutOfBoundsException',
    },
    {
      group: 'java-string-methods',
      label: 'no-javascript-only-method',
      expr: "'ab'.includes('a')",
      expect: throwsEval(),
      ref: 'java.lang.String has no includes; Spring raises method-not-found',
    },
  ];
}

/**
 * The type surface `README.md` advertises.
 *
 * Before this was fixed every case below raised, because the default evaluation
 * context held a stub type locator whose `findType` always threw, so `T(...)`,
 * `instanceof` and `new ...` were documented but unusable.
 */
function typeSurfaceCases(): DraftCase[] {
  const values: readonly ValueRow[] = [
    ['T(java.lang.Math).abs(-5)', 5, 'type surface#static method via fully qualified name'],
    ['T(Math).abs(-5)', 5, 'type surface#java.lang is imported implicitly'],
    ['T(Math).max(3, 7)', 7, 'type surface#Math.max'],
    ['T(Math).pow(2, 10)', 1024, 'type surface#Math.pow'],
    ['T(Math).round(3.6)', 4, 'type surface#Math.round'],
    ['T(Math).sqrt(16)', 4, 'type surface#Math.sqrt'],
    ['T(Math).PI', Math.PI, 'type surface#static field'],
    ['T(Integer).MAX_VALUE', 2147483647, 'type surface#static field'],
    ['T(Integer).MIN_VALUE', -2147483648, 'type surface#static field'],
    ["T(Integer).parseInt('42')", 42, 'type surface#Integer.parseInt'],
    ["T(Long).parseLong('99')", 99, 'type surface#Long.parseLong'],
    ["T(Double).parseDouble('1.5')", 1.5, 'type surface#Double.parseDouble'],
    ["T(Boolean).parseBoolean('true')", true, 'type surface#Boolean.parseBoolean'],
    ['T(String).valueOf(42)', '42', 'type surface#String.valueOf'],
    ["T(String).format('%.2f', 3.14159)", '3.14', 'type surface#String.format'],
    ["T(String).format('%d items', 3)", '3 items', 'type surface#String.format'],
    ["T(String).join('-', 'a', 'b')", 'a-b', 'type surface#String.join'],
    ['123 instanceof T(Integer)', true, 'docs#instanceof'],
    ["'xyz' instanceof T(Integer)", false, 'docs#instanceof'],
    ["'abc' instanceof T(String)", true, 'docs#instanceof'],
    ['true instanceof T(Boolean)', true, 'docs#instanceof'],
    ['1.5 instanceof T(Double)', true, 'docs#instanceof'],
    ['123 instanceof T(Object)', true, 'docs#instanceof'],
    ['new java.util.Date(0) instanceof T(java.util.Date)', true, 'docs#constructor reference'],
  ];
  return values.map(([expr, val, ref]) => ({
    group: 'type-surface',
    label: expr,
    expr,
    expect: value(val),
    ref,
  }));
}

/**
 * Type names and members that do not exist must report, not resolve to null.
 */
function typeSurfaceErrorCases(): DraftCase[] {
  return [
    {
      group: 'type-surface',
      label: 'unknown-type-name',
      expr: 'T(NoSuchType)',
      expect: throwsEval(),
      ref: 'TypeLocator#findType raises TYPE_NOT_FOUND',
    },
    {
      group: 'type-surface',
      label: 'unknown-static-method',
      expr: 'T(Math).noSuchMethod(1)',
      expect: throwsEval(),
      ref: 'a type resolves only against its own static members',
    },
    {
      group: 'type-surface',
      label: 'unknown-static-field',
      expr: 'T(Math).noSuchField',
      expect: throwsEval(),
      ref: 'TypeDescriptorAccessor reports an unreadable member',
    },
  ];
}

export const CORPUS: readonly ConformanceCase[] = build([
  ...keywordCases(),
  ...literalKeywordCases(),
  ...keywordPrefixCases(),
  ...unicodeIdentifierCases(),
  ...numericTowerCases(),
  ...logicalOperandCases(),
  ...numericKindCases(),
  ...operandTypingCases(),
  ...longPrecisionCases(),
  ...equalityCases(),
  ...strictnessCases(),
  ...divisionByZeroCases(),
  ...baselineCases(),
  ...javaStringMethodCases(),
  ...javaStringErrorCases(),
  ...typeSurfaceCases(),
  ...typeSurfaceErrorCases(),
  ...propertyAndCollectionCases(),
]);
