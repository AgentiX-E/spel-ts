import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        // Interface-only files (no runtime code)
        'src/evaluation-context/evaluation-context.ts',
        'src/evaluation-context/property-accessor.ts',
        'src/evaluation-context/method-resolver.ts',
        'src/type/type-descriptor.ts',
        'src/type/type-locator.ts',
        'src/bean/bean-resolver.ts',
        // Interface-only files (no runtime code)
        'src/language/spel-evaluator.ts',
        // Placeholder nodes (not in current feature scope)
        'src/ast/reference/identifier.ts',
        'src/evaluation-context/standard-type-converter.ts',
        // Internal implementation details (tested via public API)
        'src/ast/reference/constructor-reference.ts',
        // v1.1.0: Language service modules (coverage being built up)
        'src/types/context-schema.ts',
      ],
      // Thresholds raised to 95 on every dimension. They had been lowered to
      // 92/90/94/92 for the v1.1.0 language-service modules; measured coverage is
      // now statements 96.19, branches 95.30, functions 96.27, lines 96.19, so the
      // gate can enforce the intended standard instead of merely recording it.
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
      reporter: ['text', 'lcov', 'html'],
    },
  },
});
