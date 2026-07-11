import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/member-delimiter-style': ['error', {
        multiline: { delimiter: 'semi', requireLast: true },
        singleline: { delimiter: 'semi', requireLast: true },
      }],
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/restrict-template-expressions': ['error', {
        allowNumber: true,
        allowBoolean: true,
      }],
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    files: ['src/tokenizer/char-flags.ts'],
    rules: {
      // Bit-shift enum values are intentional for bit flag design
      '@typescript-eslint/prefer-literal-enum-member': 'off',
      // Non-null assertions on pre-allocated Uint16Array indices 0-127
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['src/util/lru-cache.ts'],
    rules: {
      // Map.get() after .has() check is safe
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['src/ast/**/*.ts', 'src/expression-state.ts', 'src/tokenizer/tokenizer.ts', 'src/spel-expression-parser.ts'],
    rules: {
      // Non-null assertions on array index access that is always in-bounds
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['src/ast/operator/**/*.ts', 'src/ast/collection/**/*.ts', 'src/ast/control-flow/**/*.ts', 'src/ast/reference/indexer.ts'],
    rules: {
      // Constructors delegate different param types (operatorName string) to parent
      '@typescript-eslint/no-useless-constructor': 'off',
    },
  },
  {
    ignores: ['dist/', 'coverage/', 'node_modules/'],
  },
);
