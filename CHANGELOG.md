# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.2] - 2026-09-14

### Fixed

- **`String.format('%c', ...)` returned the argument's digits.** The conversion is documented as
  supported and models Java's, but was implemented as `String(argument)` — which is `%s`. Java
  reads an integral argument as a code point, so `String.format('%c', 65)` is `'A'` and this
  returned `'65'`. An integral argument is now read as a code point, and a character passes
  through. **This changes what that call returns**, which is the point: a caller receiving `'65'`
  was receiving the wrong value, silently, because the conversion was documented as working.
- **The completion prefix was found with a scan that was quadratic in the input.** `getPrefixAt`
  matched `/(#|@|T\()?[\w.]*$/` against everything before the cursor. On text that ends in a long
  run of name characters the end anchor rejects, the engine retries the quantified class from every
  offset: measured at 615 ms for 32 000 characters, four times the work for twice the input. Since
  the text is whatever the caller passes as the expression, a large document cost seconds per
  completion. It is a single backward pass now, and the prefixes it produces are unchanged.

### Changed

- The development toolchain moved to `vitest` 4 for the advisory closure its patched release
  carries. Nothing under `dist/` changed for it, and no shipped dependency changed.

## [2.0.1] - 2026-09-13

### Fixed
- The `[2.0.0]` entry omitted a breaking change: the tokenizer no longer classifies nine
  words, and `LITERAL_BOOLEAN` and `LITERAL_NULL` are never emitted. It is listed there
  now. It had been recorded only under *Changed*, which said the words are resolved by
  the parser without saying what that means for the token stream — and it is the one
  change here that reached a downstream consumer: `spel-editor` lost the highlighting for
  all nine until it was adapted, which is how the gap was found.

  No code changed in this release. It exists so the published record of 2.0.0 is
  complete, since a released version's own tarball cannot be edited.

## [2.0.0] - 2026-09-13

### Breaking changes

The public surface narrowed or renumbered in four places. All four move the port
closer to Spring, and all four are observable by an existing caller:

- **`TokenKind` ordinals shifted.** `MOD` moved from 14 to 15 and `EOF` from 53 to 54,
  and every member between them moved with it. Code that compares or stores an ordinal
  must be updated; code that uses the member names is unaffected.
- **An unsuffixed integer literal above `int` range is now rejected.** `3000000000` is
  a parse error where it previously parsed; `3000000000L` is the only spelling that
  SpEL accepts.
- **`getValue()` returns a `bigint`** for an integer outside the range a JavaScript
  number holds exactly, where it previously returned a rounded `number`. Within the
  safe range the result is unchanged.
- **The tokenizer no longer classifies nine words.** `true`, `false` and `null` used to
  be reported as `LITERAL_BOOLEAN` and `LITERAL_NULL`, and `and`, `or`, `matches`,
  `between`, `instanceof` and `new` as token kinds of their own. All nine are now
  `IDENTIFIER`, because SpEL resolves them in the parser with `equalsIgnoreCase` — which
  is also what lets a field be named `and`. `LITERAL_BOOLEAN` and `LITERAL_NULL` are
  consequently never emitted. Code that reads the token stream must decide these from
  the text; code that parses or evaluates is unaffected, because the parser still
  resolves them.

An upgrade that refers to `TokenKind` members by name, stays inside the `int` range and
does not read the token stream needs no change. The rationale for each item is in
*Changed* below.

### Added
- Spring conformance suite (`tests/conformance/`) with an executable corpus of
  154 expressions, each citing the Spring source that justifies its expected
  result. The suite distinguishes `rejects-valid`, `accepts-invalid` and
  `wrong-value` divergences.
- `tests/conformance/known-divergences.ts`, an enumerated record of the
  remaining divergences, guarded by a ratchet that fails the build on any new
  divergence and on any recorded divergence that has been resolved without being
  removed.
- `src/util/ascii.ts` — locale-independent ASCII case folding, used for keyword
  recognition.
- `src/tokenizer/keyword-table.ts` — the textual operator keyword table,
  mirroring Spring's `ALTERNATIVE_OPERATOR_NAMES`.
- `src/type/numeric.ts` — the Java numeric model: binary numeric promotion,
  truncating integer division, 32-bit and 64-bit wrapping, and IEEE-754
  behaviour for the floating kinds.
- Corpus coverage for the explicit literal suffixes (`numeric-kinds`), for
  operands that cannot take part in arithmetic (`operand-typing`), and for long
  literals beyond float64 precision (`long-precision`).
- `src/evaluation-context/java-number-methods.ts` — the numeric wrapper method
  table: `byteValue`, `shortValue`, `intValue`, `longValue`, `floatValue`,
  `doubleValue`, `toString`, `equals` and `compareTo`, which had no
  implementation before.
- `bigint` as a numeric kind, standing in for `java.math.BigInteger`. It ranks
  between `long` and `float`, so a BigInt combined with an `int` or a `long` stays
  exact while a BigInt combined with a `double` widens to a double.
- `src/type/java-types.ts` — the `java.lang` type catalogue: `Math`, `String`,
  `Integer`, `Long`, `Double`, `Boolean`, `Character`, `Object`, `Number` and
  `java.util.Date`, with their static fields and a documented subset of
  `String.format`.
- `src/evaluation-context/java-string-methods.ts` — the `java.lang.String`
  method table, including `matches`, `equalsIgnoreCase`, `replaceFirst`,
  `compareTo`, `isBlank` and `strip`. A string target is resolved against this
  table only, so a name the JavaScript `String` happens to provide, such as
  `includes`, does not resolve; Spring would raise method-not-found.
- `src/type/numeric.ts` — the Java numeric model: binary numeric promotion,
  truncating integer division, 32-bit and 64-bit wrapping, and IEEE-754
  behaviour for the floating kinds.
- Corpus coverage for the explicit literal suffixes (`numeric-kinds`), for
  operands that cannot take part in arithmetic (`operand-typing`), and for long
  literals beyond float64 precision (`long-precision`).

### Changed
- `TokenKind` member ordinals are pinned. `DIV` had been inserted among the operators
  of an automatically numbered enum, which shifted every member declared after it —
  `MOD` from 14 to 15, `EOF` from 53 to 54. Each member now carries an explicit ordinal
  and `tests/unit/token-kind-stability.test.ts` pins the whole table, so a future
  insertion fails that suite instead of silently renumbering the enum.
- `getValue()` returns a `bigint` for an integer outside the range a JavaScript
  number holds exactly, where it previously returned a rounded `number`. Only
  values that were already wrong change type: within the safe range the result is
  still a `number`.
- Textual operators are now matched case-insensitively, as Spring documents:
  `AND`, `Or`, `Div`, `MOD` and every other casing are accepted.
- `and`, `or`, `matches`, `between`, `instanceof`, `new`, `true`, `false` and
  `null` are resolved by the parser rather than the tokenizer, mirroring Spring.
  This also lets those words be used as ordinary property and method names, so
  `'abc'.matches('a.*')` and a field named `and` now parse correctly.
- Identifiers may contain any Unicode letter, matching Spring's use of
  `Character.isLetter`. Identifiers such as `年龄`, `café` and `αβγ` are now
  accepted, which the natural-language pipeline relies on.
- An unsuffixed integer literal is an `int`, so one that does not fit is now a
  parse error rather than being retyped as a `long` or a bigint by its magnitude:
  `3000000000` and `9223372036854775807` must be written `3000000000L` and
  `9223372036854775807L`. This narrows accepted input — an expression that
  evaluated before may now throw — and it is deliberate, because SpEL rejects
  both spellings: `Integer.parseInt` is what converts an unsuffixed literal, and
  only the `L` suffix selects the long path. Unsuffixed hexadecimal is bounded the
  same way, so `0xFFFFFFFF` is rejected too. The lowest `int` cannot be written
  negatively either (`-2147483648` is a parse error, `-2147483648L` is not), which
  is the same rule that already applied to the lowest `long`.

### Fixed
- Textual operators were only recognised in lower case, so valid expressions
  such as `true AND false`, `2 EQ 2` and `7 MOD 4` failed to parse.
- The `div` operator was missing entirely, so `6 div 3` failed to parse.
- The literal keywords `true`, `false` and `null` were case-sensitive, so `TRUE`
  and `NULL` failed.
- Non-ASCII identifiers were rejected because the character table stopped at
  ASCII 127.
- Integer division returned a fractional result: `8 / 5` evaluated to `1.6`
  where Java yields `1`. Integral division and remainder now truncate toward
  zero, `int` arithmetic wraps at 32 bits and `long` at 64 bits, and a zero
  divisor throws for the integral kinds while yielding `Infinity` or `NaN` for
  the floating kinds, as IEEE-754 requires.
- Logical operators applied JavaScript truthiness and returned an operand, so
  `true and 5` evaluated to `5`. They now require Boolean operands and return a
  Boolean, matching Spring's `OperatorAnd`, `OperatorOr` and `OperatorNot`,
  which still short-circuit.
- Equality coerced across types by comparing string forms, so `'1' == 1` and
  `true == 1` were both true. It now follows Spring's `equalityCheck`, which
  compares numerically only between two numbers and never coerces a String to a
  Number.
- Unary minus was represented as a binary subtraction with a synthesised null
  left operand, which made it indistinguishable from a genuine `null - x` and
  routed negation through binary arithmetic. It is now a single-operand node.
- `between` accepted a `<value> between <lower> and <upper>` form that Spring does
  not have. Spring's `between` takes a two-element list only, so that spelling is
  now rejected instead of producing an expression that parses here and fails in
  production Spring.
- `**` was accepted as an exponentiation operator. Spring has no such operator:
  it tokenizes as two `*` tokens and the parser rejects the expression. `^` is
  the power operator.
- Chained assignment was accepted, so `a = b = 1` evaluated. Spring binds the
  right-hand side at logical-or precedence, which makes chaining a parse error.
- The `T(...)` type operator was matched case-insensitively, so a lowercase
  `t(...)` was treated as a type reference. Spring tests `"T".equals(...)`, which
  makes the operator case-sensitive.
- `$[` selected the first element. Spring defines `^[` as select-first and `$[`
  as select-last; both were mapped to select-first, and the non-SpEL `.*[` was
  accepted as select-last. `items.$[price > 20]` returned the first match where
  Spring returns the last.
- `toStringAST()` rendered unary `not` as `(true ! )` and dropped the upper bound
  of `between`, rendering `(1 between 1)` for `1 between {1, 5}`. Neither output
  re-parsed, so any consumer round-tripping the AST received a broken expression.
- The compound selection path advanced one token too many, so `items. .![n]`
  evaluated to `[true, true]` rather than projecting the field, and
  `items. .?[n > 2]` failed to parse.
- Method calls on a string resolved against JavaScript's `String` before the Java
  semantics were consulted, and several names are shared with different
  behaviour. `replaceAll` was the worst case: Java takes a regular expression and
  JavaScript takes a literal, so `'a1b2'.replaceAll('\d', '-')` returned the
  input unchanged instead of `a-b-`.
- `replace` replaced only the first occurrence, because the JavaScript
  implementation won the lookup. Java replaces every occurrence, so
  `'aXbXc'.replace('X', '-')` returned `a-bXc`.
- `split` treated its argument as a literal rather than a regular expression, and
  kept trailing empty strings where Java discards them.
- `matches` and `equalsIgnoreCase` were unavailable, so `'abc'.matches('a.*')`
  and `'abc'.equalsIgnoreCase('ABC')` raised method-not-found.
- `charAt` returned an empty string for an out-of-range index and the JavaScript
  `substring` clamped rather than failing. Java reports both, so a bad index is
  now surfaced instead of being silently masked.
- `T(...)`, `instanceof` and `new ...` did not work at all, although the README
  documents all three. `StandardEvaluationContext` installed a stub type locator
  whose `findType` always threw, and `StandardTypeLocator` shipped with an empty
  registry and no `java.lang` defaults, so installing it by hand did not help
  either. A working locator is now installed by default and `java.lang` is
  imported implicitly, so `T(String)` and `T(java.lang.String)` resolve to the
  same type.
- An unknown member of a type returned null instead of reporting, so
  `T(Math).noSuchField` produced a value rather than an error and a misspelled
  field name was presented as a legitimate null.
- A method's arguments were resolved against the method's receiver rather than
  against the object the expression started from. `s.substring(i)`,
  `s.charAt(i)` and `T(String).format('%.2f', n)` all failed when the argument was
  a bare name, while `i.toString()` worked — a compound expression rebinds the
  receiver as the root of the state handed to the following node, so the argument
  was read as a member of the receiver. Arguments now resolve at the expression's
  root scope, and a receiver still resolves in its own scope, so
  `items.?[price > 20]` continues to read `price` from the element.
- `toFixed` and `toExponential` resolved on a number, although no Java type has
  either method. They were callable only because JavaScript's `Number` provides
  them, so an expression using one worked here and failed in Spring. A number is
  now resolved against the Java wrapper classes only. `T(String).format('%.2f', n)`
  is the Java route to a formatted number, and `T(Math).round(n * 100) / 100` for a
  rounded value.
- An integer outside the range a JavaScript number holds exactly was either
  rejected or silently mis-compared. Arithmetic on a BigInt supplied by the
  environment threw, `10n == 10` and `10n > 5` were both false, and a long literal
  beyond 2^53 rounded: `9007199254740993L - 9007199254740992L` evaluated to `0`.
  The numeric model now carries a `bigint` kind, accepts a BigInt operand,
  compares BigInt against Number exactly, and parses an integer literal exactly —
  keeping a `number` within the safe range and a `bigint` beyond it. A literal
  outside the 64-bit `long` range is rejected, because Java has no counterpart
  for it.
- `T(String).valueOf(42)` returned the type handle itself. `valueOf` exists on
  `Object.prototype`, so the JavaScript method won the lookup before the handle's
  own static members were consulted — the same shadowing that affected string and
  number receivers.
- Integer division returned a fractional result: `8 / 5` evaluated to `1.6`
  where Java yields `1`. Integral division and remainder now truncate toward
  zero, `int` arithmetic wraps at 32 bits and `long` at 64 bits, and a zero
  divisor throws for the integral kinds while yielding `Infinity` or `NaN` for
  the floating kinds, as IEEE-754 requires.
- Logical operators applied JavaScript truthiness and returned an operand, so
  `true and 5` evaluated to `5`. They now require Boolean operands and return a
  Boolean, matching Spring's `OperatorAnd`, `OperatorOr` and `OperatorNot`,
  which still short-circuit.
- Equality coerced across types by comparing string forms, so `'1' == 1` and
  `true == 1` were both true. It now follows Spring's `equalityCheck`, which
  compares numerically only between two numbers and never coerces a String to a
  Number.
- Unary minus was represented as a binary subtraction with a synthesised null
  left operand, which made it indistinguishable from a genuine `null - x` and
  routed negation through binary arithmetic. It is now a single-operand node.

## [1.2.2] - 2026-07-20
### Changed
- Unified badge style with CI/Docs/Coverage/TypeScript/Node.js badges
- Added `configure-pages@v6` step to CI for GitHub Pages deployment
- Added deploy retry on transient error
- Added `.npmrc` with `engine-strict=true` and `auto-install-peers=true`
- Updated test count references (1,110+ tests, 96%+ coverage)
- Updated CONTRIBUTING.md coverage thresholds to match vitest config

## [1.2.1] - 2026-07-19
### Fixed
- Removed arbitrary depth limit; recurse to bottom with circular reference detection

## [1.2.0] - 2026-07-18
### Added
- Recursive ContextSchema extraction (up to depth 3)
- Language service infrastructure: NodeType, AstWalker, SpelFormatter, SpelDiagnosticEngine, SpelCompletionEngine
- SpelEvaluatorAdapter for adapting evaluator instances
- SpelEvaluator interface for pluggable evaluators
- AST public getters on all concrete AST classes
- SpelExpression.getAST() method

### Changed
- Coverage thresholds raised to 92/90/94/92
- Strict TypeScript mode enabled (strictFunctionTypes, noUncheckedIndexedAccess)
- All language service modules at ≥95% branch coverage

## [1.1.1] - 2025-07-13

### Changed
- `as unknown as` refactored for type safety in AST references and adapters
- Code quality improvements across language service modules

### Fixed
- ESLint configuration fixes for strict lint compliance

## [1.1.0] - 2025-07-12

### Added
- Language Service Infrastructure: `NodeType`, `AstWalker`, `SpelFormatter`, `SpelReferenceExtractor`, `SpelDiagnosticEngine`, `SpelCompletionEngine`
- `SpelEvaluatorAdapter` for adapting evaluator instances
- `ContextSchema` types for evaluation context schemas
- `SpelEvaluator` interface for pluggable evaluators
- AST public getters on all concrete AST classes
- `SpelExpression.getAST()` method for AST access
- All concrete AST classes exported from public API

## [1.0.1] - 2025-07-01

### Fixed
- CI fixes only

## [1.0.0] - 2025-06-15

### Added
- Initial release with full SpEL parser/evaluator

[2.0.1]: https://github.com/AgentiX-E/spel-ts/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/AgentiX-E/spel-ts/compare/v1.2.2...v2.0.0
[1.2.2]: https://github.com/AgentiX-E/spel-ts/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/AgentiX-E/spel-ts/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/AgentiX-E/spel-ts/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/AgentiX-E/spel-ts/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/AgentiX-E/spel-ts/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/AgentiX-E/spel-ts/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/AgentiX-E/spel-ts/releases/tag/v1.0.0
