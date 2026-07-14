# Contributing

Thanks for your interest in contributing to `@agentix-e/spel-ts`. This document covers conventions and quality gates.

## Branch Naming

All development happens on the `master` branch. Feature branches should follow the pattern:

```
<type>/<short-description>
```

Examples: `feat/language-service`, `fix/tokenizer-edge-case`, `docs/api-reference`.

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling, or CI changes |
| `style` | Formatting, semicolons, etc. (not for logic changes) |

### Scopes

Common scopes: `parser`, `evaluator`, `context`, `language`, `ast`, `tokenizer`, `type`.

## Quality Gates

All contributions must pass the following gates before being merged:

```bash
pnpm typecheck   # Strict TypeScript type checking
pnpm lint        # ESLint (no errors, no warnings)
pnpm test        # Test suite with coverage thresholds
pnpm build       # Build ESM + CJS bundles
```

### Coverage Thresholds

- **Statements**: >= 80%
- **Branches**: >= 80%
- **Functions**: >= 80%
- **Lines**: >= 80%

## Test Requirements

1. **New features** must include tests covering:
   - Happy path
   - Error/edge cases
   - Any new branches or conditions

2. **Bug fixes** must include a regression test that fails on the old code and passes on the fix.

3. **Refactoring** should not reduce test coverage. If you remove code paths, remove corresponding tests.

4. Use the existing test patterns:
   - `vitest` test framework (`describe`/`it`/`expect`)
   - Tests live in `tests/` directory
   - Follow the naming convention of existing test files

## Development Setup

```bash
pnpm install
pnpm build
pnpm test
```

## Pull Request Process

1. Ensure all quality gates pass.
2. Update documentation and type declarations if the public API changes.
3. Add a changelog entry under `Unreleased` (or the appropriate version).
4. Request review from a maintainer.
