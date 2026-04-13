import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

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
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // TypeScript handles undefined variables better than ESLint
      'no-undef': 'off',
    },
  },
  {
    // Test files, seed scripts, and bootstrap entrypoint may use any console method
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.spec.tsx',
      '**/*.test.tsx',
      '**/prisma/seed*.ts',
      '**/src/main.ts',
    ],
    rules: {
      'no-console': 'off',
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
      '**/node_modules/',
      '**/dist/',
      '**/.next/',
      '**/build/',
      '**/coverage/',
      '**/.turbo/',
      '**/next-env.d.ts',
    ],
  },
];
