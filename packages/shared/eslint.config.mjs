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
    files: ['src/__tests__/**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: false },
    },
  },
  {
    ignores: ['tsup.config.ts', 'vitest.config.ts', 'dist/'],
  },
];
