// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['eslint.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  // Frontend: ES modules + browser globals
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Shared rules for all TypeScript files
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      // DRY: Ban duplicate imports from the same module
      'no-duplicate-imports': 'error',
      // Ban `private` keyword — use `#` prefix instead
      'no-restricted-syntax': [
        'error',
        {
          selector: "PropertyDefinition[accessibility='private']",
          message:
            'Use # prefix for private class fields instead of the private keyword.',
        },
        {
          selector: "MethodDefinition[accessibility='private']",
          message:
            'Use # prefix for private methods instead of the private keyword.',
        },
        {
          selector: "TSParameterProperty[accessibility='private']",
          message:
            'Use a # class field + parameter assignment instead of a constructor private parameter.',
        },
      ],
      // Enforce immutable patterns
      'prefer-const': 'error',
      'no-var': 'error',
      // Prevent duplicate variable/function names in same scope
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'warn',
    },
  },
);
