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
        // Dead code / placeholder nodes (Phase 4 cleanup pending)
        'src/ast/reference/identifier.ts',
        'src/evaluation-context/standard-type-converter.ts',
      ],
      // Phase 4 target: 88%+ (interface files excluded)
      thresholds: {
        statements: 88,
        branches: 85,
        functions: 85,
        lines: 88,
      },
      reporter: ['text', 'lcov', 'html'],
    },
  },
});
