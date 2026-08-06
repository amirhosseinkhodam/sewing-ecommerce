// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['eslint.config.mjs', 'frontend/**', 'backend/src/generated/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  // Backend: type-checked rules + Node.js globals
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['backend/src/**/*.ts', 'backend/prisma/**/*.ts'],
  })),
  {
    files: ['backend/src/**/*.ts', 'backend/prisma/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'commonjs',
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
      '@typescript-eslint/no-unsafe-return': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'no-duplicate-imports': 'error',
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
      'prefer-const': 'error',
      'no-var': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'warn',
    },
  },
);
