import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      // Thresholds raised progressively per Phase
      // Phase 3 target: 95%+
      thresholds: {
        statements: 55,
        branches: 50,
        functions: 50,
        lines: 55,
      },
      reporter: ['text', 'lcov', 'html'],
    },
  },
});
