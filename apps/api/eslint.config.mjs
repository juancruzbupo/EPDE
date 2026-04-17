import rootConfig, { localPlugin } from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  {
    // Enforce repository pattern: services must not import PrismaService
    // directly. Allowlist mirrors eslint-rules/no-prisma-in-service.mjs —
    // both guardrails freeze the same set of exceptions.
    files: ['src/**/*.service.ts'],
    ignores: [
      'src/prisma/**',
      'src/auth/auth-audit.service.ts',
      'src/metrics/metrics-collector.service.ts',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['../prisma/prisma.service', '../../prisma/prisma.service', '../../../prisma/prisma.service'],
          message: 'Services must not inject PrismaService directly. Use a Repository instead. If justified, add an eslint-disable comment with rationale.',
        }],
      }],
    },
  },
  {
    // Pair of the no-restricted-imports rule above: even if a service manages
    // to hold a PrismaService reference, calling `this.prisma.*` from a
    // service bypasses the Repository layer and silently skips soft-delete
    // filters, nested-include helpers and cursor pagination. See SIEMPRE #4
    // and the allowlist in eslint-rules/no-prisma-in-service.mjs.
    files: ['src/**/*.service.ts'],
    ignores: ['src/**/*.spec.ts'],
    plugins: {
      local: localPlugin,
    },
    rules: {
      'local/no-prisma-in-service': 'error',
    },
  },
  {
    // Prisma $transaction soft-delete guardrail. The soft-delete extension
    // does NOT apply inside $transaction / withTransaction callbacks — reads
    // and updates on soft-deletable models must set `deletedAt: null` in
    // where explicitly, or `deletedAt: <date>` in data for cascade soft-
    // deletes. See the rule header and src/prisma/prisma.service.ts for the
    // underlying Prisma limitation.
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.spec.ts'],
    plugins: {
      local: localPlugin,
    },
    rules: {
      'local/no-tx-without-soft-delete-filter': 'error',
    },
  },
  {
    // Nested include soft-delete guardrail. Relations loaded via
    // `include: { X: true }` (or without a `where.deletedAt` filter) leak
    // soft-deleted rows because the extension only intercepts root
    // operations. See src/prisma/soft-delete-include.ts for the
    // ACTIVE_FILTER helper.
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.spec.ts'],
    plugins: {
      local: localPlugin,
    },
    rules: {
      'local/no-soft-deletable-include-without-filter': 'error',
    },
  },
  {
    // Repository override documentation guardrail. `tsconfig.noImplicitOverride`
    // already forces the `override` keyword; this rule adds the second layer:
    // whenever a repository overrides a BaseRepository method, a JSDoc block
    // must explain why the base behavior is insufficient. See ADR-011.
    files: ['src/**/*.repository.ts'],
    ignores: ['src/**/*.spec.ts'],
    plugins: {
      local: localPlugin,
    },
    rules: {
      'local/repository-override-must-be-documented': 'error',
      'local/no-repository-without-justification': 'error',
    },
  },
  {
    ignores: ['dist/', 'prisma/', 'test/', 'jest-e2e.config.ts', 'jest.config.js', 'prisma.config.ts'],
  },
];
