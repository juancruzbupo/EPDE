import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

import mobileQueryRequiresStaleTime from './eslint-rules/mobile-query-requires-stale-time.mjs';
import noInlineRiskThreshold from './eslint-rules/no-inline-risk-threshold.mjs';
import noPrismaInService from './eslint-rules/no-prisma-in-service.mjs';
import noSoftDeletableIncludeWithoutFilter from './eslint-rules/no-soft-deletable-include-without-filter.mjs';
import noTxWithoutSoftDeleteFilter from './eslint-rules/no-tx-without-soft-delete-filter.mjs';

export const localPlugin = {
  rules: {
    'no-tx-without-soft-delete-filter': noTxWithoutSoftDeleteFilter,
    'no-soft-deletable-include-without-filter': noSoftDeletableIncludeWithoutFilter,
    'mobile-query-requires-stale-time': mobileQueryRequiresStaleTime,
    'no-prisma-in-service': noPrismaInService,
    'no-inline-risk-threshold': noInlineRiskThreshold,
  },
};

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
  // NOTE: API-scoped local rules (no-tx-without-soft-delete-filter,
  // no-soft-deletable-include-without-filter, no-prisma-in-service) are
  // *activated* from apps/api/eslint.config.mjs with a `src/**/*.ts` glob so
  // they fire consistently whether ESLint is run from the monorepo root or
  // from the apps/api directory. Defining them here with `apps/api/src/**`
  // works from root but the glob breaks when the config is spread into
  // apps/api/eslint.config.mjs (relative path mismatch).
  //
  // We still *register* the `local` plugin at root for the same files so
  // `eslint-disable-next-line local/<rule>` directives resolve during lint
  // runs that only see the root config (e.g. husky/lint-staged, which runs
  // from the repo root with file paths relative to root).
  {
    files: ['apps/api/src/**/*.ts'],
    plugins: {
      local: localPlugin,
    },
  },
  // ── Risk score centralization (web + mobile UI) ──────────────────────────
  // `task.riskScore >= 12 | >= 6` comparisons must go through `getRiskLevel`
  // from @epde/shared so the high/medium/low boundaries + color classes
  // stay in sync across call sites. See PR-UX-1 for the helper.
  {
    files: ['apps/web/src/**/*.{ts,tsx}', 'apps/mobile/src/**/*.{ts,tsx}'],
    ignores: [
      'apps/web/src/**/*.test.{ts,tsx}',
      'apps/web/src/**/*.spec.{ts,tsx}',
      'apps/mobile/src/**/*.test.{ts,tsx}',
      'apps/mobile/src/**/*.spec.{ts,tsx}',
    ],
    plugins: {
      local: localPlugin,
    },
    rules: {
      'local/no-inline-risk-threshold': 'error',
    },
  },
  // ── Mobile query staleTime guardrail ─────────────────────────────────────
  // Every useQuery / useInfiniteQuery in mobile hooks must set an explicit
  // staleTime (preferably a STALE_TIME.X tier). See SIEMPRE #100 and the
  // rule file header.
  {
    files: ['apps/mobile/src/hooks/**/*.ts', 'apps/mobile/src/hooks/**/*.tsx'],
    ignores: ['apps/mobile/src/hooks/**/__tests__/**', 'apps/mobile/src/hooks/**/*.test.ts'],
    plugins: {
      local: localPlugin,
    },
    rules: {
      'local/mobile-query-requires-stale-time': 'error',
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
