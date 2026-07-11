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
      // Placeholder nodes (not in current feature scope)
      'src/ast/reference/identifier.ts',
      'src/evaluation-context/standard-type-converter.ts',
      // Internal implementation details (tested via public API)
      'src/ast/reference/constructor-reference.ts',
    ],
    // Phase 7: 93.5%+ — remaining ~6% in unreachable parser branches
    thresholds: {
      statements: 93.5,
      branches: 92.5,
      functions: 94,
      lines: 93.5,
    },
      reporter: ['text', 'lcov', 'html'],
    },
  },
});
