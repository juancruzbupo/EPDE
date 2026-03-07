import rootConfig from '../../eslint.config.mjs';

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
    // Enforce repository pattern: services must not import PrismaService directly
    files: ['src/**/*.service.ts'],
    ignores: ['src/prisma/**', 'src/auth/auth-audit.service.ts'],
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
    ignores: ['dist/', 'prisma/', 'test/', 'jest-e2e.config.ts', 'jest.config.js', 'prisma.config.ts'],
  },
];
