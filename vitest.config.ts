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
      thresholds: {
        statements: 65,
        branches: 60,
        functions: 60,
        lines: 65,
      },
      reporter: ['text', 'lcov', 'html'],
    },
  },
});
