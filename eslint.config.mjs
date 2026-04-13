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
  // ── Module Boundary Rules (API) ───────────────────────────────────────────
  // Layer hierarchy: core/prisma/redis → infrastructure (email, upload) → domain → scheduler
  // Rule 1: Domain modules must not import from the scheduler layer.
  //         Schedulers orchestrate domain — the dependency arrow must never reverse.
  {
    files: ['apps/api/src/**/*.ts'],
    ignores: [
      'apps/api/src/scheduler/**',
      'apps/api/src/app.module.ts',
      // spec files test scheduler services directly — allowed
      'apps/api/src/**/*.spec.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/scheduler/**'],
              message:
                'Domain modules must not import from the scheduler layer. Schedulers depend on domain, not vice versa (see docs/adr/README.md layer hierarchy).',
            },
          ],
        },
      ],
    },
  },
  // Rule 2: Core/infrastructure modules must not import from domain modules.
  //         Core is foundational — importing domain would create a downward dependency.
  {
    // health/ is exempt: it legitimately imports queue names from domain modules to run health checks.
    files: [
      'apps/api/src/core/**/*.ts',
      'apps/api/src/prisma/**/*.ts',
      'apps/api/src/redis/**/*.ts',
      'apps/api/src/metrics/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: [
                '../auth/**',
                '../budgets/**',
                '../categories/**',
                '../clients/**',
                '../dashboard/**',
                '../email/**',
                '../inspections/**',
                '../landing-settings/**',
                '../maintenance-plans/**',
                '../notifications/**',
                '../properties/**',
                '../quote-templates/**',
                '../service-requests/**',
                '../task-templates/**',
                '../tasks/**',
                '../upload/**',
                '../users/**',
              ],
              message:
                'Core/infrastructure modules must not import from domain modules. Extract shared logic to common/ or @epde/shared instead.',
            },
          ],
        },
      ],
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
