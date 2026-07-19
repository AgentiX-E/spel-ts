# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.1.1]: https://github.com/AgentiX-E/spel-ts/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/AgentiX-E/spel-ts/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/AgentiX-E/spel-ts/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/AgentiX-E/spel-ts/releases/tag/v1.0.0
