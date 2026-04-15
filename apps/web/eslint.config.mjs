// NOTE: QUERY_KEYS centralization and maxPages enforcement are handled via
// code review + ai-development-guide rules #14, #17 (AST-based ESLint
// selectors are too fragile for these patterns).
import rootConfig from '../../eslint.config.mjs';
import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...rootConfig,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // Test files are excluded from tsconfig.json — skip projectService parsing
    files: ['src/**/__tests__/**/*.ts', 'src/**/__tests__/**/*.tsx'],
    languageOptions: {
      parserOptions: { projectService: false },
    },
  },
  {
    // User-uploaded photos use <img> because next/image doesn't support blob: URLs
    // or arbitrary R2/S3 domains without explicit whitelisting in next.config.ts.
    files: [
      'src/app/(dashboard)/service-requests/**/*.tsx',
      'src/app/(dashboard)/properties/**/*.tsx',
    ],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
  {
    // Web combined hooks must stay under 150 LOC. When a use-X.ts grows past
    // this it's already the split threshold — promote to
    // use-X-queries.ts + use-X-mutations.ts + use-X.ts (barrel), following
    // SIEMPRE #43. Split variants (`-queries.ts` / `-mutations.ts`) are
    // intentionally ignored so each side can grow naturally.
    //
    // `use-task-operations-mutations.ts` at ~270 LOC is accepted as the
    // canonical example of a split hook doing real work.
    files: ['src/hooks/use-*.ts'],
    ignores: ['src/hooks/use-*-queries.ts', 'src/hooks/use-*-mutations.ts'],
    rules: {
      'max-lines': [
        'error',
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'dist/'],
  },
];
