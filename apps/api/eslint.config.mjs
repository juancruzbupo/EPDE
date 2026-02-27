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
    ignores: ['dist/', 'prisma/', 'test/', 'jest-e2e.config.ts', 'jest.config.js', 'prisma.config.ts'],
  },
];
