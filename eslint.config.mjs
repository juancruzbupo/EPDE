import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // TypeScript handles undefined variables better than ESLint
      'no-undef': 'off',
    },
  },
  {
    // Allow same-name const + type pattern in shared package (e.g., const UserRole = {}; type UserRole = ...)
    files: ['packages/shared/**/*.ts'],
    rules: {
      'no-redeclare': 'off',
    },
  },
  prettierConfig,
  {
    ignores: [
      'node_modules/',
      'dist/',
      '.next/',
      'build/',
      'coverage/',
      '.turbo/',
      '**/next-env.d.ts',
    ],
  },
];
