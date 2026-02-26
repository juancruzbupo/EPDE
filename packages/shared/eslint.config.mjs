import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // Allow same-name const + type pattern (e.g., const UserRole = {} as const; type UserRole = ...)
      'no-redeclare': 'off',
    },
  },
  {
    ignores: ['tsup.config.ts', 'vitest.config.ts', 'dist/', 'src/__tests__/'],
  },
];
