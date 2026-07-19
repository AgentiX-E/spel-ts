# @agentix-e/spel-ts

> Pure TypeScript Spring Expression Language (SpEL) evaluator — zero native dependencies, browser & Node.js ready.

[![CI](https://github.com/AgentiX-E/spel-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/AgentiX-E/spel-ts/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@agentix-e/spel-ts)](https://www.npmjs.com/package/@agentix-e/spel-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## What is @agentix-e/spel-ts?

`@agentix-e/spel-ts` is a **pure TypeScript implementation of the Spring Expression Language (SpEL)**. It parses and evaluates SpEL expressions in any JavaScript environment — browsers, Node.js, Deno, and edge runtimes — **without any native dependencies or JVM requirement**. It implements the full SpEL grammar (literals, operators, collections, type references, bean references, method invocation, constructor invocation, ternary/elvis operators, safe navigation, collection selection/projection) matching [Spring Framework's official semantics](https://docs.spring.io/spring-framework/reference/core/expressions.html) exactly.

### When should I use it?

- You need **runtime expression evaluation** in a TypeScript/JavaScript application
- You're building a **rules engine, workflow system, or dynamic configuration** platform
- You want **Spring ecosystem compatibility** without running a JVM
- You need an embeddable expression language with **zero external dependencies**

## Quick Start

```bash
npm install @agentix-e/spel-ts
```

```typescript
import { SpelExpressionParser, StandardEvaluationContext } from '@agentix-e/spel-ts';

const parser = new SpelExpressionParser();

// Simple evaluation
parser.parseExpression('2 + 3 * 4').getValue();        // 14
parser.parseExpression("'hello' + ' world'").getValue(); // 'hello world'

// With variables
const ctx = new StandardEvaluationContext();
ctx.setVariable('score', 85);
parser.parseExpression('#score >= 60 ? "PASS" : "FAIL"').getValueWithContext(ctx); // 'PASS'

// With root object
const dataCtx = new StandardEvaluationContext({ user: { name: 'Alice', age: 30 } });
parser.parseExpression('user.age > 18').getValueWithContext(dataCtx); // true
```

## Supported Syntax

### Literals
| Type | Example |
|------|---------|
| null | `null` |
| boolean | `true`, `false` |
| integer | `42`, `0xFF` |
| long | `42L`, `999l` |
| float/double | `3.14`, `2.5F`, `1.5E+2` |
| string | `'hello'`, `"world"`, `'it''s'` |

### Operators
| Category | Operators |
|----------|-----------|
| Arithmetic | `+`, `-`, `*`, `/`, `%`, `mod`, `^` |
| Comparison | `==`, `eq`, `!=`, `ne`, `<`, `lt`, `<=`, `le`, `>`, `gt`, `>=`, `ge` |
| Logical | `&&`, `and`, `\|\|`, `or`, `!`, `not` |
| Special | `matches`, `between`, `instanceof` |
| Conditional | `? :` (ternary), `?:` (elvis) |
| Assignment | `=` |

### Collections & Navigation
| Feature | Syntax |
|---------|--------|
| Inline list | `{1, 2, 3}` |
| Inline map | `{'key': 'value', 'k2': 'v2'}` |
| Property chain | `a.b.c` |
| Safe navigation | `a?.b` |
| Selection | `list.?[#this > 5]` |
| Projection | `list.![#this.name]` |
| Indexer | `a[0]`, `map['key']` |
| Variable | `#varName`, `#this` |

### Types & Beans
| Feature | Syntax |
|---------|--------|
| Type reference | `T(java.lang.Math)` |
| Constructor | `new java.util.Date()` |
| Bean reference | `@myBean` |
| Factory bean | `&@factory` |

## API Reference

Full API documentation is available at: https://AgentiX-E.github.io/spel-ts/

### Core Classes

```typescript
import {
  SpelExpressionParser,    // Main entry point for parsing expressions
  SpelExpression,           // Compiled expression (AST)
  StandardEvaluationContext, // Default evaluation context
  SpelParserConfiguration,  // Parser options
  TypedValue,               // Value + type descriptor wrapper
  SpelMessage,              // Error code enum (40+)
  // Interfaces
  EvaluationContext,
  PropertyAccessor,
  MethodResolver,
  TypeLocator,
  BeanResolver,
} from '@agentix-e/spel-ts';
```

## Project Status

| Metric | Value |
|--------|-------|
| Tests | 1030 passing |
| Coverage | 94.51% statements / 93.32% branches |
| TypeScript | 5.x strict mode |
| Bundles | ESM + CJS |
| Dependencies | 0 runtime dependencies |

## FAQ

### Is spel-ts fully compatible with Spring's SpEL?
Yes. spel-ts implements the complete SpEL grammar specification and passes 1,030+ test cases covering all operator types, collection operations, type references, and edge cases defined in the Spring reference manual.

### Can I use it in the browser?
Yes. spel-ts has zero native dependencies and ships as both ESM and CJS bundles. It has been tested in Chrome, Firefox, Safari, and Edge.

### How does it compare to other expression evaluators?
Unlike generic expression parsers (mathjs, expr-eval), spel-ts specifically targets Spring SpEL compatibility — making it the only choice for projects migrating from or integrating with Spring ecosystems.

### What's the performance like?
The parser is hand-written (not generated) and optimized for TypeScript. Typical expressions evaluate in microseconds. 1,030+ tests validate correctness and performance characteristics.

## License

MIT © AgentiX-E

## Ecosystem

- [@agentix-e/nl2spel](https://github.com/AgentiX-E/nl2spel) — Natural language → SpEL expression generation engine
- [@agentix-e/spel-editor](https://github.com/AgentiX-E/spel-editor) — Web-embeddable SpEL editor (CodeMirror 6 + spel-ts powered)
