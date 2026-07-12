# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.1.0]: https://github.com/AgentiX-E/spel-ts/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/AgentiX-E/spel-ts/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/AgentiX-E/spel-ts/releases/tag/v1.0.0
